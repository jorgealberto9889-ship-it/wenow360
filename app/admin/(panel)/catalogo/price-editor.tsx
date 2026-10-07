"use client";

import { useActionState, useState } from "react";
import { money } from "@/lib/labels";
import { saveProductPrices, type FormState } from "../actions";

export function PriceEditor({ id, publicPrice, distributorPrice }: { id: string; publicPrice: number; distributorPrice: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveProductPrices(prev, formData);
    if (result?.ok) setEditing(false);
    return result;
  }, undefined);

  if (!editing) {
    return (
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] text-[var(--muted)]">Público <span className="line-through">{money(publicPrice)}</span></div>
          <div className="text-[17px] font-extrabold text-[var(--navy)]">{money(distributorPrice)} <span className="text-[10.5px] font-bold text-[#087748]">miembro</span></div>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="press text-[12px] font-bold text-[var(--blue)]">Editar precios</button>
      </div>
    );
  }
  const input = "w-full rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--blue)]";
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-semibold text-[var(--muted)]">Público<input name="publicPrice" type="number" min={1} step={1} defaultValue={publicPrice} className={input} /></label>
        <label className="text-[11px] font-semibold text-[var(--muted)]">Miembro<input name="distributorPrice" type="number" min={1} step={1} defaultValue={distributorPrice} className={input} /></label>
      </div>
      {state?.error && <p className="text-[11.5px] font-semibold text-[#9a1d17]">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="press rounded-lg bg-[var(--blue)] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar"}</button>
        <button type="button" onClick={() => setEditing(false)} className="press rounded-lg border border-[var(--line)] px-3 py-1.5 text-[12px] font-bold text-[#4a4547]">Cancelar</button>
      </div>
    </form>
  );
}
