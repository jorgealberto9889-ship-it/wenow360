"use client";

import { useActionState } from "react";
import type { BillingProfile } from "@/lib/billing";
import { saveProfile, type ProfileState } from "./actions";

const input = "mt-1 w-full rounded-[10px] border border-[var(--line)] bg-white px-3.5 py-2.5 text-[13px] text-[#4a4547] outline-none focus:border-[var(--blue)]";
const label = "block text-[11px] font-semibold text-[var(--muted)]";

export function ProfileForm({ profile }: { profile: BillingProfile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, undefined);
  return (
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="md:col-span-2"><span className={label}>Razón social</span><input name="legalName" defaultValue={profile.legalName} maxLength={120} className={input} autoComplete="off" /></label>
      <label><span className={label}>RFC</span><input name="rfc" defaultValue={profile.rfc} maxLength={13} className={`${input} uppercase`} autoComplete="off" /></label>
      <label><span className={label}>Correo para enviar la factura</span><input name="email" type="email" defaultValue={profile.email} maxLength={120} className={input} autoComplete="off" /></label>
      <label><span className={label}>Régimen fiscal</span><input name="taxRegime" defaultValue={profile.taxRegime} placeholder="Ej. 601 General de Ley Personas Morales" maxLength={80} className={input} autoComplete="off" /></label>
      <label><span className={label}>Código postal fiscal</span><input name="zip" defaultValue={profile.zip} inputMode="numeric" maxLength={5} className={input} autoComplete="off" /></label>
      <label><span className={label}>Uso del CFDI</span><input name="cfdiUse" defaultValue={profile.cfdiUse} maxLength={4} className={`${input} uppercase`} autoComplete="off" /></label>
      <div className="flex items-end gap-3 md:col-span-2">
        <button disabled={pending} className="press rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar datos"}</button>
        {state?.ok && <span className="text-[12.5px] font-semibold text-[#0d9a56]">Datos guardados.</span>}
        {state?.error && <span role="alert" className="text-[12.5px] font-semibold text-[var(--red)]">{state.error}</span>}
      </div>
    </form>
  );
}
