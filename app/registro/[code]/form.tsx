"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inputClass } from "../../portal/(acceso)/forms";
import { submitApplication } from "./actions";

const labelClass = "text-[12.5px] font-semibold text-[var(--navy)]";

export function RegistrationForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(submitApplication.bind(null, code), undefined);
  if (state?.ok) {
    return (
      <div className="mt-6 rounded-2xl bg-[#e5f8ef] p-4 text-[13.5px] leading-normal text-[#0b5e3a]">
        <b>¡Recibimos tu solicitud!</b> El equipo de WeNow la revisará. Cuando esté aprobada te llegará un correo con tu enlace de WeNow 360 y el acceso a tu portal. Revisa también tu carpeta de spam.
      </div>
    );
  }
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className={labelClass}>Nombre completo<input name="displayName" autoComplete="name" required minLength={3} maxLength={80} className={inputClass} /></label>
      <label className={labelClass}>Número de distribuidor WeNow<input name="distributorNumber" required maxLength={40} inputMode="numeric" className={inputClass} /></label>
      <label className={labelClass}>WhatsApp<input name="whatsapp" type="tel" autoComplete="tel-national" required placeholder="10 dígitos" className={inputClass} /></label>
      <label className={labelClass}>Correo<input name="email" type="email" autoComplete="email" required className={inputClass} /></label>
      <label className={labelClass}>Tu enlace de referido de la tienda WeNow<input name="storeUrl" type="url" required placeholder="https://store.wenow.global/…" maxLength={500} className={inputClass} /><span className="mt-1 block text-[11.5px] font-normal text-[#8a8587]">Es el enlace que lleva directo a tu tienda; tus clientes llegarán ahí al comprar.</span></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2.5 text-[12.5px] leading-normal text-[#4a4547]">
        <input name="privacy" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--blue)]" />
        <span>
          Autorizo a WeNow a usar estos datos para crear mi enlace de WeNow 360, enviarme los avisos de mis prospectos y contactarme sobre mi cuenta. Consulta el{" "}
          <Link href="/aviso-de-privacidad" target="_blank" className="font-semibold text-[var(--blue)] underline">aviso de privacidad</Link>.
        </span>
      </label>
      {state?.error && <p role="alert" className="rounded-[10px] bg-[#fdeceb] px-3 py-2 text-[12.5px] font-medium text-[#9a1d17]">{state.error}</p>}
      <button type="submit" disabled={pending} className="press mt-1 rounded-full bg-[var(--blue)] py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(165,25,89,0.26)] disabled:opacity-60">
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
