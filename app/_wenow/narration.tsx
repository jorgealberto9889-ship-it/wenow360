"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./ui";

type Status = "idle" | "loading" | "playing" | "paused" | "error";
type State = { section: string | null; status: Status };
type Api = {
  state: State;
  playSequence: (sections: string[], start?: number) => void;
  toggle: (section: string, sequence: string[]) => void;
  pauseResume: () => void;
  stop: () => void;
};

const Ctx = createContext<Api | null>(null);
export const useNarration = () => useContext(Ctx);

export const sectionAnchor = (section: string) => `narr-${section}`;

// Un solo reproductor para todo el resultado. Reproduce las secciones de cada acto en secuencia y
// desplaza la pantalla a la sección que se está narrando.
export function NarrationProvider({ token, titles, children }: { token: string; titles: Record<string, string>; children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<{ list: string[]; index: number }>({ list: [], index: 0 });
  const [state, setState] = useState<State>({ section: null, status: "idle" });

  const url = useCallback((s: string) => `/api/narration/${token}/${s}`, [token]);

  const start = useCallback(
    (index: number) => {
      const a = audio.current;
      const { list } = queue.current;
      if (!a || index >= list.length) {
        setState({ section: null, status: "idle" });
        return;
      }
      queue.current.index = index;
      const section = list[index];
      a.src = url(section);
      setState({ section, status: "loading" });
      a.play().catch(() => setState({ section, status: "error" }));

      const el = document.getElementById(sectionAnchor(section));
      if (el) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
      // Precarga la siguiente sección para que no haya silencio entre una y otra.
      const next = list[index + 1];
      if (next) void fetch(url(next)).catch(() => {});
    },
    [url],
  );

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    a.onplaying = () => setState((s) => ({ ...s, status: "playing" }));
    a.onended = () => start(queue.current.index + 1);
    // Si una sección no tiene audio (por ejemplo, sin escaneo), se salta a la siguiente.
    a.onerror = () => start(queue.current.index + 1);
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, [start]);

  const api: Api = {
    state,
    playSequence: (sections, from = 0) => {
      queue.current = { list: sections, index: from };
      start(from);
    },
    toggle: (section, sequence) => {
      if (state.section === section && (state.status === "playing" || state.status === "paused")) {
        api.pauseResume();
        return;
      }
      const i = sequence.indexOf(section);
      api.playSequence(i >= 0 ? sequence : [section], Math.max(i, 0));
    },
    pauseResume: () => {
      const a = audio.current;
      if (!a || !state.section) return;
      if (a.paused) {
        void a.play();
      } else {
        a.pause();
        setState((s) => ({ ...s, status: "paused" }));
      }
    },
    stop: () => {
      audio.current?.pause();
      queue.current = { list: [], index: 0 };
      setState({ section: null, status: "idle" });
    },
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {state.section && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-20 flex justify-center px-5">
          <div className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-full bg-[var(--navy)] py-2 pr-2 pl-4 text-white shadow-[0_14px_30px_rgba(56,56,56,0.3)]">
            <span className="flex h-4 items-end gap-[3px]" aria-hidden>
              {[8, 14, 10].map((h, i) => (
                <span
                  key={i}
                  className={cx("w-[3px] rounded-sm bg-[#eaa4c1]", state.status === "playing" && "animate-pulse motion-reduce:animate-none")}
                  style={{ height: h, animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold" aria-live="polite">
              {state.status === "loading" ? "Preparando…" : titles[state.section] ?? "Narrando"}
            </span>
            <button type="button" onClick={api.pauseResume} aria-label={state.status === "paused" ? "Continuar" : "Pausar"} className="press flex size-8 items-center justify-center rounded-full bg-white/15">
              {state.status === "paused" ? (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5L13 8L4 13.5V2.5Z" /></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2.5" width="3.5" height="11" rx="1" /><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" /></svg>
              )}
            </button>
            <button type="button" onClick={api.stop} aria-label="Detener narración" className="press flex size-8 items-center justify-center rounded-full bg-white/15">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function ListenButton({ section, sequence }: { section: string; sequence: string[] }) {
  const n = useNarration();
  if (!n) return null;
  const active = n.state.section === section;
  const playing = active && n.state.status === "playing";
  const label = !active ? "Escuchar" : n.state.status === "loading" ? "Cargando…" : playing ? "Pausar" : "Continuar";
  return (
    <button
      type="button"
      onClick={() => n.toggle(section, sequence)}
      aria-pressed={playing}
      className={cx(
        "press inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-[background-color,color] duration-150",
        active ? "bg-[var(--blue)] text-white" : "bg-[#fbeef4] text-[var(--blue)]",
      )}
    >
      {playing ? (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2.5" width="3.5" height="11" rx="1" /><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" /></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5L13 8L4 13.5V2.5Z" /></svg>
      )}
      {label}
    </button>
  );
}
