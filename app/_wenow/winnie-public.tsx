"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { Bubble } from "./assistant";
import type { Distributor } from "./questions";
import { ArrowRight, cx, noAutofill } from "./ui";
import { OPEN_WINNIE_EVENT, WinnieOrb } from "./winnie-orb";

type Message = { role: "user" | "model"; content: string; error?: boolean };

const MAX_CHARS = 500;
const GREETING = `¡Hola! Soy ${BRAND.assistantName}, el asistente virtual de ${BRAND.shortName}. Te explico qué es ${BRAND.name}, cómo actúan los ingredientes de los productos y qué hábitos pueden ayudarte con lo que te preocupa. ¿En qué te ayudo?`;
const SUGGESTIONS = [
  `¿Qué es ${BRAND.name} y cómo funciona?`,
  "Duermo mal y siento mucho estrés",
  "¿Qué respaldo científico tienen los ingredientes?",
];

// Winnie en la página de inicio: botón siempre visible y chat. Aún no conoce a la persona, así que no
// recibe ni guarda datos personales; el historial vive solo en esta pantalla.
export function WinniePublic({ distributor, onStart }: { distributor: Distributor; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (text: string) => {
    const message = text.trim().slice(0, MAX_CHARS);
    if (!message || sending) return;
    const history = messages.filter((m) => !m.error).slice(-8).map(({ role, content }) => ({ role, content }));
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const res = await fetch("/api/winnie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history, distributor: distributor.slug }),
      });
      const body = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      setMessages((m) => [...m, body.answer ? { role: "model", content: body.answer } : { role: "model", content: body.error ?? "No pude responder en este momento.", error: true }]);
    } catch {
      setMessages((m) => [...m, { role: "model", content: "No pude conectarme. Revisa tu conexión e intenta de nuevo.", error: true }]);
    } finally {
      setSending(false);
    }
  };

  const startQuiz = () => {
    setOpen(false);
    onStart();
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 250); }}
          aria-label={`Pregúntale a ${BRAND.assistantName}, el asistente virtual de ${BRAND.shortName}`}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-2.5 transition-transform duration-150 active:scale-95 sm:right-6 sm:bottom-6"
        >
          <span className="hidden rounded-full bg-white px-3.5 py-2 text-[12.5px] font-bold text-[var(--navy)] shadow-[0_8px_20px_rgba(56,56,56,0.15)] ring-1 ring-[var(--line)] sm:block">
            Pregúntale a {BRAND.assistantName}
          </span>
          <WinnieOrb size={60} animated />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(56,56,56,0.35)] sm:items-end sm:justify-end sm:bg-transparent sm:p-6" onClick={() => setOpen(false)}>
          <div
            role="dialog" aria-modal="true" aria-label={`${BRAND.assistantName}, asistente virtual de ${BRAND.shortName}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85dvh] w-full max-w-[440px] flex-col rounded-t-[24px] bg-[var(--bg)] shadow-[0_-12px_40px_rgba(56,56,56,0.2)] motion-safe:animate-[sheet_240ms_cubic-bezier(0.23,1,0.32,1)] sm:h-[min(640px,80dvh)] sm:rounded-[24px] sm:shadow-[0_24px_60px_rgba(56,56,56,0.28)] sm:ring-1 sm:ring-[var(--line)]"
          >
            <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 pt-4 pb-3">
              <WinnieOrb size={40} animated={sending} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-extrabold text-[var(--navy)]">{BRAND.assistantName}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--muted)]">{sending ? "Escribiendo…" : `Asistente virtual de ${BRAND.shortName} · Inteligencia artificial`}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="press flex size-8 items-center justify-center rounded-full bg-white text-[var(--ink)] ring-1 ring-[var(--line)]">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4" aria-live="polite">
              <p className="mb-3 text-center text-[10.5px] leading-snug text-[#8a8587]">
                {BRAND.assistantName} es una inteligencia artificial y puede equivocarse. No sustituye la valoración de un profesional de la salud. No escribas datos personales.
              </p>
              <Bubble role="model" content={GREETING} playing={null} onPlay={() => {}} />
              {messages.length === 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button key={q} type="button" onClick={() => void ask(q)} className="press rounded-full border-[1.5px] border-[#efc9da] bg-[#fbeef4] px-3 py-2 text-left text-[12.5px] font-semibold text-[var(--blue)]">
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2.5">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role} content={m.content} playing={null} onPlay={() => {}} />
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
                <textarea
                  ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))} rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(draft); } }}
                  placeholder="Escribe tu pregunta…" aria-label="Tu pregunta"
                  {...noAutofill} name="winnie-pregunta" autoCorrect="on" autoCapitalize="sentences" spellCheck enterKeyHint="send"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--blue)]"
                />
                <button type="button" onClick={() => void ask(draft)} disabled={!draft.trim() || sending} aria-label="Enviar" className="press flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-white disabled:bg-[#bdb5b9]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className={cx("mt-2.5 flex items-center justify-between gap-3", !distributor.whatsapp && "justify-end")}>
                {distributor.whatsapp && (
                  <a href={`https://wa.me/${distributor.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[#0d9a56]">
                    Hablar con mi asesor
                  </a>
                )}
                <button type="button" onClick={startQuiz} className="press inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-[var(--blue)]">
                  Comenzar mi evaluación gratis <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
