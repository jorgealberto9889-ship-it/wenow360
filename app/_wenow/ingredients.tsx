"use client";

import { useState } from "react";
import type { Ficha } from "@/db/schema";
import { fichaPdfUrl } from "@/lib/fichas";
import { Chevron, Collapse } from "./ui";

// Datos rápidos, ingrediente por ingrediente (con su ciencia), sinergias y la ficha técnica en PDF.
export function IngredientDossier({ productId, ficha }: { productId: string; ficha: Ficha }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pdf = fichaPdfUrl(productId);

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-[var(--bg)] p-3">
        {ficha.quick.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[#8a8587] uppercase">{k}</dt>
            <dd className="text-[12.5px] font-semibold text-[var(--navy)]">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="mb-2 text-[11px] font-bold text-[var(--navy)]">Ingrediente por ingrediente</div>
        <ul className="flex flex-col gap-1.5">
          {ficha.ingredients.map((ing) => {
            const open = openKey === ing.key;
            return (
              <li key={ing.key} className="rounded-xl border border-[var(--line)] bg-white">
                <button
                  type="button" aria-expanded={open} onClick={() => setOpenKey(open ? null : ing.key)}
                  className="press flex w-full items-center gap-2 px-3 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold tracking-[0.05em] text-[var(--blue)] uppercase">{ing.tag}</span>
                    <span className="block text-[13px] font-extrabold text-[var(--navy)]">{ing.name}</span>
                    <span className="block text-[11px] text-[#8a8587] italic">{ing.sub}</span>
                  </span>
                  <span className="text-[var(--blue)]"><Chevron open={open} /></span>
                </button>
                <Collapse open={open}>
                  <div className="flex flex-col gap-2.5 px-3 pb-3">
                    <p className="text-[12px] leading-[1.55] text-[#4a4547]">{ing.desc}</p>
                    <div>
                      <div className="mb-1 text-[10px] font-bold tracking-[0.05em] text-[#8a8587] uppercase">Compuestos clave</div>
                      <div className="flex flex-wrap gap-1.5">
                        {ing.comp.map((c) => (
                          <span key={c} className="rounded-full bg-[#fbeef4] px-2.5 py-1 text-[11px] font-semibold text-[var(--blue)]">{c}</span>
                        ))}
                      </div>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {ing.ben.map((b) => (
                        <li key={b} className="flex items-start gap-1.5 text-[12px] leading-snug text-[#4a4547]">
                          <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--blue)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <p className="rounded-lg bg-[var(--bg)] px-3 py-2 text-[11.5px] leading-snug text-[var(--muted)]">
                      <b className="text-[var(--navy)]">¿Sabías que…?</b> {ing.dato}
                    </p>
                  </div>
                </Collapse>
              </li>
            );
          })}
        </ul>
      </div>

      {ficha.combo.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-bold text-[var(--navy)]">Combina bien con</div>
          <ul className="flex flex-col gap-0.5">
            {ficha.combo.map(([name, text]) => (
              <li key={name} className="text-[12px] leading-snug text-[var(--muted)]">
                <b className="text-[#4a4547]">{name}</b> · {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pdf && (
        <a
          href={pdf} target="_blank" rel="noopener noreferrer"
          className="press flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--blue)] bg-white py-2.5 text-[13px] font-bold text-[var(--blue)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 3h7l5 5v13H7V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5M10 13h6M10 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Ver ficha técnica (PDF)
        </a>
      )}
    </div>
  );
}
