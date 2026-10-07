"use client";

import Link from "next/link";
import { useActionState } from "react";
import { portalLogin, requestPasswordReset, setPasswordFromLink, type PortalState } from "../actions";

export const inputClass =
  "mt-1.5 w-full rounded-[12px] border border-[var(--line)] bg-white px-3.5 py-3 text-[15px] text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--blue)] focus:shadow-[0_0_0_3px_rgba(165,25,89,0.12)]";
const labelClass = "text-[12.5px] font-semibold text-[var(--navy)]";
const buttonClass = "press mt-1 rounded-full bg-[var(--blue)] py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(165,25,89,0.26)] disabled:opacity-60";

const ErrorText = ({ state }: { state: PortalState }) =>
  state?.error ? <p role="alert" className="rounded-[10px] bg-[#fdeceb] px-3 py-2 text-[12.5px] font-medium text-[#9a1d17]">{state.error}</p> : null;

export function LoginForm() {
  const [state, action, pending] = useActionState(portalLogin, undefined);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className={labelClass}>Correo<input name="email" type="email" autoComplete="username" required className={inputClass} /></label>
      <label className={labelClass}>Contraseña<input name="password" type="password" autoComplete="current-password" required className={inputClass} /></label>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Entrando…" : "Entrar"}</button>
      <Link href="/portal/recuperar" className="text-center text-[13px] font-semibold text-[var(--blue)]">¿Olvidaste tu contraseña?</Link>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  if (state?.ok) {
    return (
      <div className="mt-6 rounded-2xl bg-[#e5f8ef] p-4 text-[13.5px] leading-normal text-[#0b5e3a]">
        Si ese correo está registrado, te enviamos un enlace para elegir una nueva contraseña. Revisa también tu carpeta de spam.
        <Link href="/portal/entrar" className="mt-3 block font-bold text-[var(--blue)]">Volver a entrar</Link>
      </div>
    );
  }
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className={labelClass}>Correo con el que te registraste<input name="email" type="email" autoComplete="email" required className={inputClass} /></label>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Enviando…" : "Enviarme un enlace"}</button>
      <Link href="/portal/entrar" className="text-center text-[13px] font-semibold text-[var(--blue)]">Volver a entrar</Link>
    </form>
  );
}

export function NewPasswordForm({ token, isNew }: { token: string; isNew: boolean }) {
  const [state, action, pending] = useActionState(setPasswordFromLink.bind(null, token), undefined);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className={labelClass}>{isNew ? "Crea tu contraseña" : "Nueva contraseña"}<input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} /></label>
      <label className={labelClass}>Repítela<input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} /></label>
      <p className="-mt-2 text-[11.5px] text-[var(--muted)]">Mínimo 8 caracteres.</p>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Guardando…" : isNew ? "Crear y entrar" : "Guardar y entrar"}</button>
    </form>
  );
}
