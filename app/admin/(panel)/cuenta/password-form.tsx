"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

const input = "mt-1 w-full rounded-[10px] border border-[var(--line)] bg-white px-3.5 py-2.5 text-[13px] text-[#4a4547] outline-none focus:border-[var(--blue)]";
const label = "block text-[11.5px] font-semibold text-[var(--muted)]";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="mt-4 grid max-w-[420px] gap-3">
      <label><span className={label}>Contraseña actual</span><input name="current" type="password" autoComplete="current-password" required className={input} /></label>
      <label><span className={label}>Nueva contraseña (mínimo 12 caracteres)</span><input name="next" type="password" autoComplete="new-password" required minLength={12} className={input} /></label>
      <label><span className={label}>Confirma la nueva contraseña</span><input name="confirm" type="password" autoComplete="new-password" required minLength={12} className={input} /></label>
      {state?.error && <p role="alert" className="rounded-xl bg-[#fdeceb] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#9a1d17]">{state.error}</p>}
      {state?.ok && <p className="rounded-xl bg-[#e5f8ef] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#087748]">Contraseña actualizada.</p>}
      <div><button disabled={pending} className="press rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : "Cambiar contraseña"}</button></div>
    </form>
  );
}
