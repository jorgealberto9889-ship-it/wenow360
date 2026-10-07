"use client";

import { useState, useTransition } from "react";
import { inviteAllDistributors, inviteDistributor, revokePortalAccess, temporaryPassword, type AccessState } from "../actions";

const btn = "press rounded-[10px] px-4 py-2.5 text-[13px] font-bold disabled:opacity-60";

export function PortalAccess({ id, name, email, whatsapp, hasAccess, origin }: { id: number; name: string; email: string | null; whatsapp: string; hasAccess: boolean; origin: string }) {
  const [state, setState] = useState<AccessState>();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<AccessState>) => start(async () => setState(await fn()));
  const first = name.split(/\s+/)[0];
  const waText = state?.password
    ? encodeURIComponent(
        `Hola ${first}, ya tienes acceso a tu portal de WeNow 360, donde verás a tus prospectos y su resultado.\n\nEntra en: ${origin}/portal/entrar\nCorreo: ${email}\nContraseña temporal: ${state.password}\n\nTe recomiendo cambiarla en «Mi cuenta» al entrar.`,
      )
    : "";

  return (
    <div className="mt-5 max-w-[720px] rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-[var(--navy)]">Acceso al portal</h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${hasAccess || state?.password ? "bg-[#e5f8ef] text-[#087748]" : "bg-[#f2efef] text-[var(--muted)]"}`}>
          {hasAccess || state?.password ? "Con contraseña" : "Sin acceso todavía"}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--muted)]">
        En su portal ve a sus prospectos, su resumen y los productos sugeridos, y lleva su seguimiento. Entra en <span className="font-mono">{origin.replace(/^https?:\/\//, "")}/portal</span>.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pending || !email} onClick={() => run(() => inviteDistributor(id))} className={`${btn} bg-[var(--blue)] text-white`}>
          {hasAccess ? "Enviar enlace para cambiar contraseña" : "Enviar correo de lanzamiento"}
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => temporaryPassword(id))} className={`${btn} border border-[var(--line)] text-[#4a4547]`}>
          Generar contraseña temporal
        </button>
        {hasAccess && (
          <button type="button" disabled={pending} onClick={() => confirm(`¿Quitar el acceso al portal a ${name}?`) && run(() => revokePortalAccess(id))} className={`${btn} text-[#9a1d17]`}>
            Quitar acceso
          </button>
        )}
      </div>
      {!email && <p className="mt-2 text-[12px] text-[#916000]">Agrega su correo arriba para poder enviarle la invitación.</p>}
      {state?.error && <p className="mt-3 rounded-xl bg-[#fdeceb] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#9a1d17]">{state.error}</p>}
      {state?.sent && <p className="mt-3 rounded-xl bg-[#e5f8ef] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#087748]">{hasAccess ? `Listo: le enviamos a ${email} un enlace para cambiar su contraseña (válido 30 minutos).` : `Listo: le enviamos a ${email} el correo de lanzamiento con el botón para activar su panel (válido 7 días).`}</p>}
      {state?.password && (
        <div className="mt-3 rounded-xl border border-[#efc9da] bg-[#fbeef4] p-4">
          <div className="text-[12px] font-semibold text-[var(--muted)]">Contraseña temporal (solo se muestra esta vez):</div>
          <div className="mt-1 font-mono text-[20px] font-bold tracking-wide text-[var(--navy)]">{state.password}</div>
          <a href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="press mt-3 inline-block rounded-[10px] bg-[var(--whatsapp)] px-4 py-2.5 text-[13px] font-bold text-white">
            Enviársela por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

export function InviteAll({ pendingCount }: { pendingCount: number }) {
  const [state, setState] = useState<AccessState>();
  const [pending, start] = useTransition();
  if (pendingCount === 0 && !state) return null;
  return (
    <button
      type="button"
      disabled={pending || Boolean(state)}
      onClick={() => confirm(`Se enviará el correo de lanzamiento de WeNow 360 a ${pendingCount} distribuidores que aún no tienen acceso al portal. ¿Continuar?`) && start(async () => setState(await inviteAllDistributors()))}
      className="press flex items-center gap-[7px] rounded-[10px] border border-[var(--line)] bg-white px-4 py-[9px] text-[13px] font-bold text-[#4a4547] disabled:opacity-70"
    >
      {pending ? "Enviando invitaciones…" : state ? `✓ ${state.sent} correos enviados` : `Enviar lanzamiento (${pendingCount})`}
    </button>
  );
}
