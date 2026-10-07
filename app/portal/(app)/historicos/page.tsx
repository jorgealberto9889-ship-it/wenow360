import Link from "next/link";
import { shortDate } from "@/lib/admin/format";
import { legacyLeads } from "@/lib/admin/queries";
import { requireDistributor } from "@/lib/portal";

export default async function Historicos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireDistributor();
  const shown = Math.min(500, Math.max(30, Number((await searchParams).ver) || 30));
  const { items, total } = await legacyLeads(undefined, 1, shown, me.slug);
  return (
    <>
      <Link href="/portal" className="text-[13px] font-semibold text-[var(--blue)]">← Mis prospectos</Link>
      <h1 className="mt-3 text-[20px] font-extrabold text-[var(--navy)]">Prospectos de la versión anterior</h1>
      <p className="mt-1 text-[12.5px] text-[var(--muted)]">{total} personas hicieron su WeNow 360 con tu enlace en V1. Son de solo consulta.</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((l) => {
          const digits = l.phone.replace(/\D/g, "");
          const wa = digits.length === 10 ? `52${digits}` : digits;
          return (
            <li key={l.id} className="rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[var(--navy)]">{l.name}</div>
                  <div className="text-[11.5px] text-[var(--muted)]">{shortDate(l.createdAt)} · {l.advisor ? "Pidió contacto" : "No pidió contacto"}</div>
                </div>
                {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="press shrink-0 rounded-full bg-[var(--whatsapp)] px-3 py-1.5 text-[12px] font-bold text-white">WhatsApp</a>}
              </div>
              <p className="mt-2 text-[12px] leading-snug text-[#4a4547]">{l.summary}</p>
            </li>
          );
        })}
      </ul>
      {total > items.length && (
        <Link href={`/portal/historicos?ver=${shown + 30}`} scroll={false} className="press mt-3 block rounded-full bg-white py-3 text-center text-[13px] font-bold text-[var(--blue)] ring-1 ring-[var(--line)]">
          Ver más ({total - items.length})
        </Link>
      )}
    </>
  );
}
