"use client";

import { useState } from "react";

const box = "mt-1.5 w-full rounded-xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[var(--blue)]";

export function Variants() {
  const [text, setText] = useState("");
  return (
    <div className="mt-6 flex flex-col gap-6">
      <label className="block text-[14px] font-bold text-[var(--navy)]">
        1. Campo normal
        <input className={box} placeholder="Escribe aquí" />
      </label>
      <label className="block text-[14px] font-bold text-[var(--navy)]">
        2. Campo con autollenado apagado
        <input className={box} placeholder="Escribe aquí" autoComplete="off" data-form-type="other" aria-autocomplete="none" name="x-a1" />
      </label>
      <label className="block text-[14px] font-bold text-[var(--navy)]">
        3. Caja de texto grande
        <textarea className={box} rows={2} placeholder="Escribe aquí" autoComplete="off" name="x-a2" />
      </label>
      <div className="text-[14px] font-bold text-[var(--navy)]">
        4. Campo especial
        <div
          role="textbox" aria-label="Campo especial" contentEditable suppressContentEditableWarning
          className={`${box} min-h-[48px] font-normal`}
          onInput={(e) => setText(e.currentTarget.textContent ?? "")}
        />
        <p className="mt-1 text-[12px] font-normal text-[var(--muted)]">Escribiste: {text || "—"}</p>
      </div>
    </div>
  );
}
