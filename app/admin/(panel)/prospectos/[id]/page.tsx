import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areaStatus } from "@/app/_wenow/copy";
import { LEAD_STATUS, longDate, shortDate } from "@/lib/admin/format";
import { prospectDetail } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/dal";
import { money } from "@/lib/labels";
import { signResultToken } from "@/lib/result-link";
import { Avatar, Panel, StatusBadge } from "../../ui";
import { StatusPicker } from "@/app/_shared/status-picker";
import { setProspectStatus } from "../../actions";

const EMAIL_LABEL: Record<string, string> = {
  resultado: "Resultado",
  notificacion_asesor: "Aviso al asesor",
  copia_corporativa: "Copia a WeNow",
  compra_asesor: "Aviso de compra al asesor",
  compra_corporativa: "Aviso de compra a WeNow",
  recordatorio_promo: "Recordatorio del kit (20 h)",
  seguimiento: "Seguimiento (7 días)",
};
const EMAIL_STATUS: Record<string, [string, string]> = {
  sent: ["Enviado", "#087748"],
  pending: ["Pendiente", "#916000"],
  failed: ["Falló", "#d93025"],
  bounced: ["Rebotó", "#d93025"],
};
const PRIORITY: Record<string, string> = { esencial: "Esencial", prioritaria: "Prioritaria", complementaria: "Complementaria" };

export default async function ProspectoDetalle({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await prospectDetail((await params).id);
  if (!p) notFound();
  const latest = p.assessments[0];
  const snap = latest?.snapshot;
  const resultHref = latest ? `/r/${await signResultToken(latest.id)}` : null;
  const digits = p.phone.replace(/\D/g, "");
  const waDigits = digits.length === 10 ? `52${digits}` : digits;
  const first = p.name.split(/\s+/)[0];
  const waText = encodeURIComponent(`Hola ${first}, te escribo de WeNow por tu WeNow 360.`);

  return (
    <>
      <Link href="/admin/prospectos" className="text-[12.5px] font-semibold text-[var(--blue)]">← Prospectos</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        <Avatar name={p.name} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">{p.name}</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {p.distributorName ?? p.distributorSlug} · {latest ? `WeNow 360 del ${longDate(latest.completedAt)}` : `Registrado el ${longDate(p.createdAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {waDigits && (
            <a href={`https://wa.me/${waDigits}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="press rounded-[10px] bg-[var(--whatsapp)] px-4 py-[9px] text-[13px] font-bold text-white">
              WhatsApp
            </a>
          )}
          <a href={`mailto:${p.email}`} className="press rounded-[10px] border border-[var(--line)] bg-white px-4 py-[9px] text-[13px] font-bold text-[#4a4547]">Correo</a>
          {resultHref && (
            <a href={resultHref} target="_blank" rel="noopener noreferrer" className="press rounded-[10px] bg-[var(--blue)] px-4 py-[9px] text-[13px] font-bold text-white">
              Ver su resultado
            </a>
          )}
        </div>
      </div>

      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Estatus del seguimiento</h2>
          <StatusBadge status={p.status} />
        </div>
        <div className="mt-3"><StatusPicker status={p.status} action={setProspectStatus.bind(null, p.id)} /></div>
        {p.history.length > 0 && (
          <p className="mt-3 text-[11.5px] text-[#8a8587]">
            Historial: {p.history.map((h) => `${LEAD_STATUS[h.status as keyof typeof LEAD_STATUS]?.label ?? h.status} (${shortDate(h.changedAt)})`).join(" · ")}
          </p>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <Panel className="p-5">
            <h2 className="text-[14px] font-bold text-[var(--navy)]">Contacto</h2>
            <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
              <dt className="text-[var(--muted)]">Correo</dt><dd className="break-all text-[#4a4547]">{p.email}</dd>
              <dt className="text-[var(--muted)]">Teléfono</dt><dd className="text-[#4a4547]">{p.phone || "—"}</dd>
              <dt className="text-[var(--muted)]">Distribuidor</dt><dd className="text-[#4a4547]">{p.distributorName ?? p.distributorSlug}</dd>
              <dt className="text-[var(--muted)]">Evaluaciones</dt><dd className="text-[#4a4547]">{p.assessments.length}</dd>
            </dl>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[14px] font-bold text-[var(--navy)]">Autorizaciones</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[13px]">
              {[["contacto_asesor", "Que su asesor lo contacte"], ["marketing", "Recordatorios y tips por correo"]].map(([k, label]) => (
                <li key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[#4a4547]">{label}</span>
                  <b className={p.consents[k!] ? "text-[#087748]" : "text-[#8a8587]"}>{p.consents[k!] ? "Sí" : "No"}</b>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3">
                <span className="text-[#4a4547]">Escaneo facial</span>
                <b className={latest?.hasScan ? "text-[#087748]" : "text-[#8a8587]"}>{latest?.hasScan ? "Lo hizo" : "No lo hizo"}</b>
              </li>
            </ul>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[14px] font-bold text-[var(--navy)]">Correos</h2>
            {p.emails.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">Sin correos registrados.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2 text-[12.5px]">
                {p.emails.map((e, i) => {
                  const [label, color] = EMAIL_STATUS[e.status] ?? [e.status, "#6f6a6c"];
                  return (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-[#4a4547]">{EMAIL_LABEL[e.type] ?? e.type}</span>
                      <span className="font-bold" style={{ color }}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel className="p-5">
            <h2 className="text-[14px] font-bold text-[var(--navy)]">Resultado</h2>
            {!snap ? (
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">Sin resultado guardado.</p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {snap.result.areas.filter((a) => a.metric).map((a) => (
                    <span key={a.title} className="rounded-full bg-[#f2efef] px-3 py-1 text-[12px] text-[#4a4547]">
                      <b className="text-[var(--navy)]">{a.title}</b> · {areaStatus(a).toLowerCase()}
                    </span>
                  ))}
                </div>
                {snap.result.stopped || snap.products.length === 0 ? (
                  <p className="mt-3 rounded-xl bg-[#fff8e8] px-3 py-2.5 text-[12.5px] text-[#6b5413]">
                    No se sugirieron productos: {snap.result.explanation}
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {snap.products.map((pr) => {
                      const rec = snap.result.recommendations.find((r) => r.productId === pr.id);
                      return (
                        <li key={pr.id} className="flex items-center gap-3 rounded-xl border border-[#f2efef] p-2.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fbeef4]">
                            {pr.imageUrl && <Image src={pr.imageUrl} alt="" width={40} height={40} className="h-8 w-auto object-contain" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-bold text-[var(--navy)]">{pr.name}</span>
                            <span className="block text-[11px] text-[var(--muted)]">{PRIORITY[rec?.priorityLabel ?? "complementaria"]}</span>
                          </span>
                          <span className="text-right text-[12px]">
                            <span className="block text-[#8a8587] line-through">{money(pr.publicPrice)}</span>
                            <b className="text-[var(--navy)]">{money(pr.distributorPrice)}</b>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {snap.result.medicalAttention && (
                  <p className="mt-3 text-[12px] text-[var(--muted)]"><b>Nota de cuidado:</b> {snap.result.medicalAttention.title}.</p>
                )}
              </>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[14px] font-bold text-[var(--navy)]">Conversación con Winnie</h2>
            {p.messages.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">No habló con Winnie.</p>
            ) : (
              <ol className="mt-3 flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                {p.messages.map((m, i) => (
                  <li key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-snug whitespace-pre-line ${m.role === "user" ? "self-end bg-[var(--blue)] text-white" : "self-start bg-[#f2efef] text-[#4a4547]"}`}>
                    {m.content}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
