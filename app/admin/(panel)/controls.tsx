"use client";

import { useState, useTransition } from "react";

// Interruptor que llama a una acción del servidor; muestra el nuevo estado al instante.
export function Toggle({ on, label, disabled, action }: { on: boolean; label: string; disabled?: boolean; action: (next: boolean) => Promise<void> }) {
  const [optimistic, setOptimistic] = useState(on);
  const [pending, start] = useTransition();
  const value = pending ? optimistic : on;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled || pending}
      onClick={() => {
        setOptimistic(!value);
        start(() => action(!value));
      }}
      className="press relative h-6 w-[42px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: value ? "#19b96f" : "#e6e0e3" }}
    >
      <span className="absolute top-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-[180ms]" style={{ left: value ? 21 : 3 }} />
    </button>
  );
}

export function CopyButton({ text, children }: { text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
      className="press flex max-w-full items-center gap-1.5 text-left"
      title="Copiar enlace"
    >
      <span className="truncate font-mono text-[11px] text-[var(--blue)]">{copied ? "¡Copiado!" : children}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8587" strokeWidth={1.6} className="shrink-0" aria-hidden>
        <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 012-2h10" />
      </svg>
    </button>
  );
}
