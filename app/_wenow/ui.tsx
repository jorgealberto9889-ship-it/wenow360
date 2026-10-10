"use client";

import type { ReactNode } from "react";

// Atributos para que Safari en iPhone no trate el campo como formulario de pago, envío o contraseña
// (evita la barra de tarjetas, ubicación y llaves sobre el teclado) ni lo llenen gestores de contraseñas.
export const noAutofill = {
  autoComplete: "off",
  "aria-autocomplete": "none",
  "data-form-type": "other",
  "data-lpignore": "true",
  "data-1p-ignore": "true",
} as const;

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const ArrowRight = ({ className = "" }: { className?: string }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
    <path d="M2 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden
    className={cx("transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]", open && "rotate-180")}
  >
    <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#e5f8ef" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="#087748" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// `fixedFooter`: la barra inferior queda fija a la pantalla (en lugar de «sticky»). En iPhone el `sticky` pegado al borde
// inferior puede dejar el botón visible pero sin recibir el toque hasta llegar al final del scroll.
export function Screen({ top, footer, fixedFooter, children }: { top?: ReactNode; footer?: ReactNode; fixedFooter?: boolean; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-[var(--bg)]">
      {top}
      <div className="flex flex-1 flex-col px-5 pb-6">{children}</div>
      {footer && fixedFooter && (
        <>
          <div aria-hidden className="h-[104px] shrink-0" />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)]">
            <div className="mx-auto w-full max-w-[440px] px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))]">{footer}</div>
          </div>
        </>
      )}
      {footer && !fixedFooter && (
        <div className="sticky bottom-0 border-t border-[var(--line)] bg-[var(--bg)] px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </div>
  );
}

export function TopBar({ onBack, progress, label }: { onBack?: () => void; progress: number; label?: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-[var(--bg)] px-5 py-4">
      {onBack ? (
        <button
          type="button" onClick={onBack} aria-label="Regresar"
          className="press flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="size-9 shrink-0" />
      )}
      <div
        className="relative h-1.5 flex-1 rounded-full bg-[#f5e1ea]"
        role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-[var(--blue)] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
        {/* Nodo del anillo del logotipo: marca dónde vas. */}
        <span
          aria-hidden
          className="absolute top-1/2 size-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--blue)] transition-[left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] after:absolute after:inset-[4.5px] after:rounded-full after:bg-[var(--bg)]"
          style={{ left: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
      {label && <div className="shrink-0 text-[11.5px] text-[#8a8587]">{label}</div>}
    </div>
  );
}

export function QuestionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pt-3.5">
      <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">{title}</h1>
      {hint && <p className="mt-2 text-[13.5px] leading-normal text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export function SubQuestion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-2.5 text-[14px] font-bold text-[var(--navy)]">{title}</legend>
      {children}
    </fieldset>
  );
}

export function PrimaryButton({
  children, onClick, disabled, type = "button", tone = "blue",
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; tone?: "blue" | "green" }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={cx(
        "press flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-bold text-white transition-[background-color] duration-[180ms]",
        disabled ? "bg-[#bdb5b9]" : tone === "green" ? "bg-[var(--green)]" : "bg-[var(--blue)] shadow-[0_14px_30px_rgba(165,25,89,0.26)]",
      )}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press w-full pt-2.5 text-[13px] font-semibold text-[var(--muted)] underline">
      {children}
    </button>
  );
}

export function OptionCard({
  selected, onClick, label, hint, icon,
}: { selected: boolean; onClick: () => void; label: string; hint?: string; icon?: string }) {
  return (
    <button
      type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={cx(
        "press flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-3 text-left transition-[border-color,background-color] duration-[140ms]",
        selected ? "border-[var(--blue)] bg-[#fbeef4]" : "border-[var(--line)] bg-white",
      )}
    >
      {icon && (
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#fbeef4] text-[16px]" aria-hidden>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold text-[var(--navy)]">{label}</span>
        {hint && <span className="mt-px block text-[12px] text-[var(--muted)]">{hint}</span>}
      </span>
      <span
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-[border-color] duration-[140ms]",
          selected ? "border-[var(--blue)]" : "border-[#d9d2d5]",
        )}
      >
        <span
          className={cx(
            "size-2.5 rounded-full bg-[var(--blue)] transition-[transform,opacity] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
            selected ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, label,
}: { value: T | null; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 2)}, minmax(0,1fr))` }}>
      {options.map(([id, text]) => (
        <button
          key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)}
          className={cx(
            "press rounded-xl border-[1.5px] px-3 py-3 text-[13.5px] font-semibold transition-[border-color,background-color,color] duration-[140ms]",
            value === id ? "border-[var(--blue)] bg-[#fbeef4] text-[var(--navy)]" : "border-[var(--line)] bg-white text-[#4a4547]",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onClick} disabled={disabled && !selected}
      className={cx(
        "press flex items-center justify-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-3 text-[13px] font-semibold transition-[border-color,background-color,color,opacity] duration-[140ms]",
        selected ? "border-[var(--blue)] bg-[var(--blue)] text-white" : "border-[var(--line)] bg-white text-[#4a4547]",
        disabled && !selected && "opacity-45",
      )}
    >
      {selected && <CheckIcon />}
      <span>{children}</span>
    </button>
  );
}

export function CheckRow({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={checked} onClick={onClick}
      className={cx(
        "press flex w-full items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left transition-[border-color,background-color] duration-[140ms]",
        checked ? "border-[var(--blue)] bg-[#fbeef4]" : "border-[var(--line)] bg-white",
      )}
    >
      <span
        className={cx(
          "flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 text-white transition-[background-color,border-color] duration-[140ms]",
          checked ? "border-[var(--blue)] bg-[var(--blue)]" : "border-[#d9d2d5] bg-white",
        )}
      >
        <CheckIcon className={cx("transition-[transform,opacity] duration-[140ms]", checked ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
      </span>
      <span className="text-[13.5px] font-semibold text-[var(--navy)]">{label}</span>
    </button>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={cx("press relative h-[27px] w-[46px] shrink-0 rounded-full transition-[background-color] duration-[180ms]", on ? "bg-[var(--blue)]" : "bg-[var(--line)]")}
    >
      <span
        className="absolute top-[3px] size-[21px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ left: on ? 22 : 3 }}
      />
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-[22px] border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_rgba(56,56,56,0.08)]", className)}>
      {children}
    </div>
  );
}

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cx(
        "grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function ActLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-5">
      <span className="size-1.5 rounded-full bg-[var(--blue-bright)]" />
      <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">{children}</span>
    </div>
  );
}

export const money = (n: number) => `$${n.toLocaleString("es-MX")}`;

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
