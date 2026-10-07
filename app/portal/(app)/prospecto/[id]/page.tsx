import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areaStatus } from "@/app/_wenow/copy";
import { StatusPicker } from "@/app/_shared/status-picker";
import { longDate, shortDate } from "@/lib/admin/format";
import { distributorNotes, prospectDetail } from "@/lib/admin/queries";
import { money } from "@/lib/labels";
import { requireDistributor } from "@/lib/portal";
import { setLeadStatus } from "../../../actions";
import { NoteForm } from "../../client";

const PRIORITY: Record<string, string> = { esencial: "Esencial", prioritaria: "Prioritaria", complementaria: "Complementaria" };
const card = "rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]";

// El distribuidor ve contacto, áreas y productos sugeridos. Nunca respuestas de salud, notas de cuidado ni la conversación con Winnie.
export default async function PortalProspecto({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireDistributor();
  const p = await prospectDetail((await params).id);
  if (!p || p.distributorSlug !== me.slug) notFound();
  const notes = await distributorNotes(p.id, me.id);
  const snap = p.assessments[0]?.snapshot;
  const asked = p.consents.contacto_asesor === true;
  const first = p.name.split(/\s+/)[0];
  const digits = p.phone.replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  const waText = encodeURIComponent(
    asked
      ? `Hola ${first}, soy ${me.displayName}, tu asesor de bienestar WeNow. Vi tu resultado de WeNow 360 y me encantaría ayudarte con tus dudas. ¿Cuándo te queda bien que platiquemos?`
      : `Hola ${first}, soy ${me.displayName}, asesor de bienestar WeNow. Gracias por hacer tu WeNow 360. Si en algún momento tienes dudas sobre tu resultado, aquí estoy para ayudarte.`,
  );
  const btn = "press flex flex-1 items-center justify-center rounded-full py-3 text-[13.5px] font-bold";

  return (
    <>
      <Link href="/portal" className="text-[13px] font-semibold text-[var(--blue)]">← Mis prospectos</Link>
      <h1 className="mt-3 text-[22px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">{p.name}</h1>
      <p className="text-[12.5px] text-[var(--muted)]">{p.assessments[0] ? `WeNow 360 del ${longDate(p.assessments[0].completedAt)}` : `Registrado el ${longDate(p.createdAt)}`}</p>

      <p className={`mt-3 rounded-2xl px-3.5 py-3 text-[12.5px] leading-snug ${asked ? "bg-[#e5f8ef] text-[#0b5e3a]" : "bg-[#fff4df] text-[#7a4f00]"}`}>
        {asked
          ? <><b>Pidió que lo acompañes.</b> Escríbele pronto, mientras su evaluación está fresca. Recuerda que como miembro del Club WeNow paga el precio de miembro en cada producto.</>
          : <><b>No pidió que lo contacten.</b> Respeta su decisión: si le escribes, que sea un mensaje breve y sin presión.</>}
      </p>

      <div className="mt-3 flex gap-2">
        {wa && <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[var(--whatsapp)] text-white`}>WhatsApp</a>}
        {digits && <a href={`tel:${p.phone}`} className={`${btn} bg-white text-[var(--navy)] ring-1 ring-[var(--line)]`}>Llamar</a>}
        <a href={`mailto:${p.email}`} className={`${btn} bg-white text-[var(--navy)] ring-1 ring-[var(--line)]`}>Correo</a>
      </div>

      <section className={`mt-4 ${card}`}>
        <h2 className="text-[14px] font-extrabold text-[var(--navy)]">Estatus del seguimiento</h2>
        <div className="mt-3"><StatusPicker status={p.status} action={setLeadStatus.bind(null, p.id)} /></div>
      </section>

      {snap && (
        <section className={`mt-4 ${card}`}>
          <h2 className="text-[14px] font-extrabold text-[var(--navy)]">Su resultado</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {snap.result.areas.filter((a) => a.metric).map((a) => (
              <span key={a.title} className="rounded-full bg-[#f2efef] px-3 py-1 text-[12px] text-[#4a4547]">
                <b className="text-[var(--navy)]">{a.title}</b> · {areaStatus(a).toLowerCase()}
              </span>
            ))}
          </div>
          {snap.result.stopped || snap.products.length === 0 ? (
            <p className="mt-3 text-[12.5px] leading-snug text-[var(--muted)]">
              A esta persona no se le sugirieron productos: su perfil requiere orientación profesional. Acompáñala sin ofrecerle productos.
            </p>
          ) : (
            <>
              <div className="mt-4 text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase">Productos sugeridos</div>
              <ul className="mt-2 flex flex-col gap-2">
                {snap.products.map((pr) => {
                  const rec = snap.result.recommendations.find((r) => r.productId === pr.id);
                  return (
                    <li key={pr.id} className="flex items-center gap-3 rounded-xl bg-[var(--bg)] p-2.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white">
                        {pr.imageUrl && <Image src={pr.imageUrl} alt="" width={40} height={40} className="h-8 w-auto object-contain" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-[var(--navy)]">{pr.name}</span>
                        <span className="block text-[11px] text-[var(--muted)]">{PRIORITY[rec?.priorityLabel ?? "complementaria"]}</span>
                      </span>
                      <span className="text-right text-[11.5px]">
                        <span className="block text-[#8a8587] line-through">{money(pr.publicPrice)}</span>
                        <b className="text-[var(--navy)]">{money(pr.distributorPrice)}</b>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      <section className={`mt-4 ${card}`}>
        <h2 className="text-[14px] font-extrabold text-[var(--navy)]">Mis notas</h2>
        <p className="text-[11.5px] text-[var(--muted)]">Solo tú las ves.</p>
        <NoteForm prospectId={p.id} />
        {notes.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {notes.map((n, i) => (
              <li key={i} className="rounded-xl bg-[var(--bg)] px-3 py-2.5">
                <div className="text-[10.5px] font-bold text-[var(--muted)]">{shortDate(n.createdAt)}</div>
                <p className="mt-0.5 text-[13px] leading-snug whitespace-pre-line text-[#4a4547]">{n.note}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
