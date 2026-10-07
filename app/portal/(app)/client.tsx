"use client";

import { useActionState, useState } from "react";
import { addNote, changePassword, type PortalState } from "../actions";
import { noAutofill } from "@/app/_wenow/ui";
import { inputClass } from "../(acceso)/forms";

export function LinkActions({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Hola, soy ${name}. Te comparto WeNow 360: una evaluación gratuita de 3 minutos para conocer tu bienestar y recibir orientación personalizada.`;
  const btn = "press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-bold";
  return (
    <div className="mt-3.5 flex gap-2.5">
      <button
        type="button"
        className={`${btn} bg-white/12 text-white ring-1 ring-white/25`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
      <button
        type="button"
        className={`${btn} bg-white text-[var(--navy)]`}
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title: "WeNow 360", text, url });
              return;
            } catch {
              return;
            }
          }
          window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
        }}
      >
        Compartir
      </button>
    </div>
  );
}

export function StoreLinkActions({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Hola, soy ${name}, tu asesor de bienestar WeNow. Compra tus productos en la tienda en línea con mi enlace; tus compras quedan registradas conmigo como tu asesor.`;
  const btn = "press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-bold";
  return (
    <div className="mt-3.5 flex gap-2.5">
      <button
        type="button"
        className={`${btn} bg-[var(--bg)] text-[var(--navy)] ring-1 ring-[var(--line)]`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
      <button
        type="button"
        className={`${btn} bg-[var(--blue)] text-white`}
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title: "Tienda WeNow", text, url });
            } catch {}
            return;
          }
          window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
        }}
      >
        Compartir
      </button>
    </div>
  );
}

export function NoteForm({ prospectId }: { prospectId: string }) {
  const [key, setKey] = useState(0);
  const [state, action, pending] = useActionState<PortalState, FormData>(async (prev, fd) => {
    const r = await addNote(prospectId, prev, fd);
    if (r?.ok) setKey((k) => k + 1);
    return r;
  }, undefined);
  return (
    <form key={key} action={action} className="mt-3 flex flex-col gap-2">
      <textarea {...noAutofill} name="note" rows={2} maxLength={1000} placeholder="Ej. Le escribí el martes, quiere probar Neuro CHAI." className={`${inputClass} mt-0 resize-none text-[14px]`} aria-label="Nueva nota" />
      {state?.error && <p className="text-[12px] font-semibold text-[#9a1d17]">{state.error}</p>}
      <button disabled={pending} className="press self-end rounded-full bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar nota"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  if (state?.ok) return <p className="mt-3 rounded-xl bg-[#e5f8ef] px-3.5 py-3 text-[13px] font-semibold text-[#087748]">Listo, tu contraseña se actualizó.</p>;
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <label className="text-[12.5px] font-semibold text-[var(--navy)]">Contraseña actual<input name="current" type="password" autoComplete="current-password" required className={inputClass} /></label>
      <label className="text-[12.5px] font-semibold text-[var(--navy)]">Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} /></label>
      <label className="text-[12.5px] font-semibold text-[var(--navy)]">Repítela<input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} /></label>
      {state?.error && <p className="text-[12.5px] font-semibold text-[#9a1d17]">{state.error}</p>}
      <button disabled={pending} className="press rounded-full bg-[var(--blue)] py-3 text-[14px] font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
