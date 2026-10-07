"use client";

import { useState, useTransition } from "react";
import { approveApplication, rejectApplication, type ReviewState } from "../actions";
import { CopyButton } from "../controls";

const btn = "press rounded-[10px] px-3.5 py-2 text-[12.5px] font-bold disabled:opacity-60";

export type PendingApplication = { id: string; displayName: string; distributorNumber: string; email: string; whatsapp: string; createdAt: string };

// Enlace de registro para mandar a los distribuidores y solicitudes pendientes de revisión.
export function Applications({ link, pending }: { link: string; pending: PendingApplication[] }) {
  // El aviso vive aquí y no en la fila: al aprobar o rechazar, la fila desaparece de la lista.
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Enlace de registro</h2>
        <p className="mt-1 text-[12.5px] leading-snug text-[var(--muted)]">
          Mándalo a los distribuidores que quieran su WeNow 360. Llenan sus datos y tú apruebas cada solicitud aquí; al aprobarla les llega su enlace y el acceso a su portal.
        </p>
        <div className="mt-3 rounded-[10px] bg-[var(--bg)] px-3 py-2.5"><CopyButton text={link}>{link.replace(/^https?:\/\//, "").replace(/(\/registro\/).{12}.*$/, "$1…")}</CopyButton></div>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Solicitudes pendientes</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${pending.length ? "bg-[#fff4df] text-[#7a4f00]" : "bg-[#f2efef] text-[var(--muted)]"}`}>{pending.length}</span>
        </div>
        {notice && (
          <p className={`mt-2 rounded-lg px-3 py-2 text-[12px] font-semibold ${notice.ok ? "bg-[#e5f8ef] text-[#087748]" : "bg-[#fff4df] text-[#7a4f00]"}`}>{notice.text}</p>
        )}
        {pending.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-[var(--muted)]">No hay solicitudes por revisar.</p>
        ) : (
          <ul className="mt-2">{pending.map((a) => <ApplicationRow key={a.id} app={a} onDone={setNotice} />)}</ul>
        )}
      </div>
    </div>
  );
}

function ApplicationRow({ app, onDone }: { app: PendingApplication; onDone: (n: { ok: boolean; text: string }) => void }) {
  const [state, setState] = useState<ReviewState>();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ReviewState>) =>
    start(async () => {
      const r = await fn();
      setState(r);
      if (r?.done === "aprobada") {
        onDone(r.emailed
          ? { ok: true, text: `${app.displayName} quedó aprobado. Le enviamos a ${app.email} su enlace de WeNow 360 y el acceso a su portal.` }
          : { ok: false, text: `${app.displayName} quedó aprobado, pero no se pudo enviar el correo. Invítalo desde su ficha.` });
      } else if (r?.done === "rechazada") onDone({ ok: true, text: `Rechazaste la solicitud de ${app.displayName}.` });
    });
  return (
    <li className="border-t border-[#f2efef] py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[var(--navy)]">{app.displayName}</div>
          <div className="text-[11.5px] break-words text-[#8a8587]">
            N.º {app.distributorNumber} · {app.email} · WhatsApp +{app.whatsapp} · {new Date(app.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
          </div>
        </div>
        {(

          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(() => approveApplication(app.id))} className={`${btn} bg-[var(--blue)] text-white`}>Aprobar</button>
            <button type="button" disabled={pending} onClick={() => confirm(`¿Rechazar la solicitud de ${app.displayName}?`) && run(() => rejectApplication(app.id))} className={`${btn} border border-[var(--line)] text-[#9a1d17]`}>Rechazar</button>
          </div>
        )}
      </div>
      {state?.error && <p className="mt-2 rounded-lg bg-[#fdeceb] px-3 py-2 text-[12px] font-semibold text-[#9a1d17]">{state.error}</p>}
    </li>
  );
}
