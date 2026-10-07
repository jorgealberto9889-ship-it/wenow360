"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitResult } from "@/lib/assessments";
import { winnieGreeting, quickAnswers } from "./winnie";
import { useNarration } from "./narration";
import type { Distributor } from "./questions";
import { cx, noAutofill } from "./ui";
import { OPEN_WINNIE_EVENT, WinnieOrb } from "./winnie-orb";

type Message = { role: "user" | "model"; content: string; audio?: string };

// Tarjeta para abrir a Winnie desde el contenido (cerca de la oferta).
export function WinnieInvite({ advisor }: { advisor: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_WINNIE_EVENT))}
      className="press flex w-full items-center gap-3.5 rounded-[22px] border border-[#ecd2dd] bg-[linear-gradient(135deg,#fbf4f7,#fbeef4)] p-4 text-left"
    >
      <WinnieOrb size={48} animated />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-extrabold text-[var(--navy)]">¿Te quedó alguna duda? Pregúntale a Winnie</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--muted)]">
          El asistente virtual de WeNow te explica a detalle tus productos y sus beneficios. Para tu compra, te atiende {advisor}.
        </span>
      </span>
    </button>
  );
}
const MAX_CHARS = 500;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// WAV silencioso de 0.1 s para "desbloquear" la reproducción dentro del gesto del usuario (iOS lo exige).
function silentWav() {
  const samples = 800;
  const buf = new DataView(new ArrayBuffer(44 + samples * 2));
  const str = (o: number, t: string) => [...t].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); buf.setUint32(4, 36 + samples * 2, true); str(8, "WAVE"); str(12, "fmt ");
  buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
  buf.setUint32(24, 8000, true); buf.setUint32(28, 16000, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true);
  str(36, "data"); buf.setUint32(40, samples * 2, true);
  let bin = "";
  new Uint8Array(buf.buffer).forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export function Assistant({
  token, saved, name, distributor, voiceEnabled,
}: { token: string; saved: SubmitResult; name: string; distributor: Distributor; voiceEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // La voz queda disponible pero apagada: la conversación es principalmente por texto.
  const [autoVoice, setAutoVoice] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  // Winnie solo aparece tras interactuar (Acto 3), nunca en el render del servidor.
  const [micSupported] = useState(() => getRecognition() !== null);
  const listRef = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const narration = useNarration();
  const quick = quickAnswers(saved, distributor.displayName);
  const speechUrl = (query: string) => `/api/assistant/speech/${token}?${query}`;

  useEffect(() => {
    const a = new Audio();
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    audio.current = a;
    return () => a.pause();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_WINNIE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WINNIE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      audio.current?.pause();
      recognition.current?.stop();
      setPlaying(null);
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const unlockAudio = () => {
    const a = audio.current;
    if (!a || !voiceEnabled) return;
    a.src = silentWav();
    void a.play().catch(() => {});
  };

  const play = (url: string) => {
    const a = audio.current;
    if (!a) return;
    narration?.stop();
    if (playing === url) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.src = url;
    setPlaying(url);
    void a.play().catch(() => setPlaying(null));
  };

  const close = () => {
    audio.current?.pause();
    recognition.current?.stop();
    setPlaying(null);
    setOpen(false);
  };

  const ask = async (text: string) => {
    const message = text.trim().slice(0, MAX_CHARS);
    if (!message || sending) return;
    if (autoVoice) unlockAudio();
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, message }),
      });
      const body = (await res.json().catch(() => ({}))) as { answer?: string; id?: string; error?: string };
      const url = body.id && voiceEnabled ? speechUrl(`m=${body.id}`) : undefined;
      setMessages((m) => [...m, { role: "model", content: body.answer ?? body.error ?? "No pude responder en este momento.", audio: url }]);
      if (url && autoVoice) play(url);
    } catch {
      setMessages((m) => [...m, { role: "model", content: "No pude conectarme. Revisa tu conexión e intenta de nuevo." }]);
    } finally {
      setSending(false);
    }
  };

  const answerQuick = (index: number) => {
    const q = quick[index];
    const url = voiceEnabled ? speechUrl(`q=${index}`) : undefined;
    setMessages((m) => [...m, { role: "user", content: q.q }, { role: "model", content: q.a, audio: url }]);
    if (url && autoVoice) play(url);
  };

  const toggleMic = () => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    if (autoVoice) unlockAudio();
    audio.current?.pause();
    const r = new Recognition();
    r.lang = "es-MX";
    r.interimResults = true;
    r.continuous = false;
    let finalText = "";
    r.onresult = (e) => {
      const parts = Array.from(e.results);
      finalText = parts.map((p) => p[0].transcript).join(" ");
      setDraft(finalText);
    };
    r.onend = () => {
      setListening(false);
      if (finalText.trim()) void ask(finalText);
    };
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  };

  const greetingUrl = voiceEnabled ? speechUrl("g=1") : undefined;

  return (
    <>
      {!open && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[152px] z-20 mx-auto flex w-full max-w-[440px] justify-end px-4">
          <button
            type="button"
            onClick={() => { setOpen(true); if (autoVoice && greetingUrl && messages.length === 0) play(greetingUrl); }}
            aria-label="Pregúntale a Winnie, el asistente virtual de WeNow"
            className="pointer-events-auto flex items-center gap-2 transition-transform duration-150 active:scale-95"
          >
            <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--navy)] shadow-[0_8px_20px_rgba(56,56,56,0.15)] ring-1 ring-[var(--line)]">
              Pregúntale a Winnie
            </span>
            <WinnieOrb size={58} animated />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(56,56,56,0.35)]" onClick={close}>
          <div
            role="dialog" aria-modal="true" aria-label="Winnie, asistente virtual de WeNow"
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85dvh] w-full max-w-[440px] flex-col rounded-t-[24px] bg-[var(--bg)] shadow-[0_-12px_40px_rgba(56,56,56,0.2)] motion-safe:animate-[sheet_240ms_cubic-bezier(0.23,1,0.32,1)]"
          >
            <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 pt-4 pb-3">
              <WinnieOrb size={40} animated={playing !== null} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-extrabold text-[var(--navy)]">Winnie</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--muted)]">
                  {playing ? "Hablando…" : listening ? "Te escucho…" : "Asistente virtual de WeNow · Inteligencia artificial"}
                </div>
              </div>
              {voiceEnabled && (
                <button
                  type="button"
                  onClick={() => { setAutoVoice((v) => !v); if (autoVoice) { audio.current?.pause(); setPlaying(null); } }}
                  aria-pressed={autoVoice}
                  className={cx("press flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold", autoVoice ? "bg-[var(--blue)] text-white" : "bg-white text-[var(--muted)] ring-1 ring-[var(--line)]")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
                    {autoVoice ? <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
                  </svg>
                  {autoVoice ? "Voz" : "Sin voz"}
                </button>
              )}
              <button type="button" onClick={close} aria-label="Cerrar" className="press flex size-8 items-center justify-center rounded-full bg-white text-[var(--ink)] ring-1 ring-[var(--line)]">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4" aria-live="polite">
              <p className="mb-3 text-center text-[10.5px] leading-snug text-[#8a8587]">Winnie es una inteligencia artificial y puede equivocarse. No sustituye la valoración de un profesional de la salud.</p>
              <Bubble role="model" content={winnieGreeting(name)} audio={greetingUrl} playing={playing} onPlay={play} />
              {messages.length === 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {quick.map((q, i) => (
                    <button key={q.q} type="button" onClick={() => answerQuick(i)} className="press rounded-full border-[1.5px] border-[#efc9da] bg-[#fbeef4] px-3 py-2 text-[12.5px] font-semibold text-[var(--blue)]">
                      {q.q}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2.5">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role} content={m.content} audio={m.audio} playing={playing} onPlay={play} />
                ))}
                {sending && (
                  <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md bg-white py-3 ring-1 ring-[var(--line)]" aria-label="Escribiendo">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-[#8a8587] motion-reduce:animate-none" style={{ animationDelay: `${d * 120}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--line)] px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              {/* Sin <form> ni autocompletado: así Safari en iPhone no abre la barra de ubicación, tarjetas y contraseñas. */}
              <div className="flex items-end gap-2">
                {micSupported && (
                  <button
                    type="button" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "Detener dictado" : "Hablarle a Winnie"}
                    className={cx("press relative flex size-11 shrink-0 items-center justify-center rounded-full", listening ? "bg-[var(--red)] text-white" : "bg-white text-[var(--blue)] ring-1 ring-[var(--line)]")}
                  >
                    {listening && <span className="absolute inset-0 rounded-full bg-[var(--red)] opacity-40 motion-safe:animate-ping" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden>
                      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                <textarea
                  value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))} rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(draft); } }}
                  placeholder={listening ? "Te escucho…" : micSupported ? "Escribe o toca el micrófono…" : "Escribe tu pregunta…"} aria-label="Tu pregunta"
                  {...noAutofill} name="celia-pregunta" autoCorrect="on" autoCapitalize="sentences" spellCheck enterKeyHint="send"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--blue)]"
                />
                <button type="button" onClick={() => void ask(draft)} disabled={!draft.trim() || sending} aria-label="Enviar" className="press flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-white disabled:bg-[#bdb5b9]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <a href={`https://wa.me/${distributor.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-[12px] font-bold text-[#0d9a56]">
                Hablar con mi asesor, {distributor.displayName}, por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const plain = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[*-]\s+/gm, "• ").replace(/[*#]/g, "");

export function Bubble({ role, content, audio, playing, onPlay }: { role: Message["role"]; content: string; audio?: string; playing: string | null; onPlay: (url: string) => void }) {
  const isPlaying = audio !== undefined && playing === audio;
  return (
    <div className={cx("flex max-w-[88%] flex-col gap-1.5", role === "user" && "self-end")}>
      <div
        className={cx(
          "rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.5] whitespace-pre-line",
          role === "user" ? "rounded-tr-md bg-[var(--blue)] text-white" : "rounded-tl-md bg-white text-[#4a4547] ring-1 ring-[var(--line)]",
        )}
      >
        {role === "model" ? plain(content) : content}
      </div>
      {audio && (
        <button type="button" onClick={() => onPlay(audio)} className="press flex items-center gap-1 self-start pl-1 text-[11px] font-bold text-[var(--blue)]">
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2.5" width="3.5" height="11" rx="1" /><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" /></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5L13 8L4 13.5V2.5Z" /></svg>
          )}
          {isPlaying ? "Pausar" : "Escuchar"}
        </button>
      )}
    </div>
  );
}
