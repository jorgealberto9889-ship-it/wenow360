import Link from "next/link";
import { distributorOptions, legacyLeads, prospectList, prospectTotals } from "@/lib/admin/queries";
import { LEAD_STATUS, parsePeriod, shortDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/dal";
import { Avatar, fieldClass, PageHeader, Pagination, Panel, PeriodSelect, StatusBadge, tableHead } from "../ui";

type Search = Record<string, string | undefined>;

export default async function Prospectos({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const legacy = sp.vista === "v1";
  const period = parsePeriod(sp.dias ?? "todo");
  const qs = (patch: Search) => {
    const next = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/prospectos?${next}`;
  };
  const [totals, options] = await Promise.all([prospectTotals(), distributorOptions()]);

  return (
    <>
      <PageHeader
        title="Prospectos"
        subtitle={`${Number(totals?.total ?? 0)} evaluaciones en V2 · ${Number(totals?.authorized ?? 0)} con contacto autorizado · ${Number(totals?.legacy ?? 0)} históricos de V1`}
        actions={
          !legacy && (
            <a
              href={`/admin/prospectos/exportar?${new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "pagina") as [string, string][])}`}
              className="press flex items-center gap-[7px] rounded-[10px] border border-[var(--line)] bg-white px-4 py-[9px] text-[13px] font-bold text-[#4a4547]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v13m0 0l-5-5m5 5l5-5M4 21h16" /></svg>
              Exportar
            </a>
          )
        }
      />

      <div className="mt-5 flex gap-1.5">
        {[["", "WeNow 360 V2"], ["v1", "Históricos V1"]].map(([v, label]) => (
          <Link
            key={v}
            href={v ? "/admin/prospectos?vista=v1" : "/admin/prospectos"}
            className={`press rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold ${(v === "v1") === legacy ? "border-[var(--blue)] bg-[var(--blue)] text-white" : "border-[var(--line)] bg-white text-[#4a4547]"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2.5">
        {legacy && <input type="hidden" name="vista" value="v1" />}
        <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, correo o teléfono" className={`${fieldClass} min-w-[220px] flex-1`} aria-label="Buscar" />
        {!legacy && (
          <>
            <select name="distribuidor" defaultValue={sp.distribuidor ?? ""} className={fieldClass} aria-label="Distribuidor">
              <option value="">Todos los distribuidores</option>
              {options.map((d) => <option key={d.slug} value={d.slug}>{d.displayName}</option>)}
            </select>
            <select name="estatus" defaultValue={sp.estatus ?? ""} className={fieldClass} aria-label="Estatus">
              <option value="">Todos los estatus</option>
              {Object.entries(LEAD_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <PeriodSelect value={period} />
          </>
        )}
        <button className="press rounded-[10px] bg-[var(--blue)] px-4 py-2.5 text-[13px] font-bold text-white">Filtrar</button>
      </form>

      {legacy ? <LegacyTable q={sp.q} page={page} qs={qs} /> : <CurrentTable sp={sp} page={page} period={period} qs={qs} />}
    </>
  );
}

async function CurrentTable({ sp, page, period, qs }: { sp: Search; page: number; period: ReturnType<typeof parsePeriod>; qs: (p: Search) => string }) {
  const { items, total, perPage } = await prospectList({ q: sp.q, distributor: sp.distribuidor, status: sp.estatus, period, page });
  return (
    <>
      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="border-b border-[var(--line)] bg-[var(--bg)]">
            <tr className={tableHead}>
              <th className="px-5 py-3 font-semibold">Prospecto</th>
              <th className="px-3 py-3 font-semibold">Distribuidor</th>
              <th className="px-3 py-3 font-semibold">Áreas principales</th>
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold">Autorizó</th>
              <th className="px-5 py-3 font-semibold">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-[#f2efef] hover:bg-[var(--bg)]">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/prospectos/${p.id}`} className="flex items-center gap-[11px]">
                    <Avatar name={p.name} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[var(--navy)]">{p.name}</span>
                      <span className="block text-[11.5px] text-[#8a8587]">{p.email} · {p.phone}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 text-[12.5px] text-[#4a4547]">{p.distributorName ?? p.distributorSlug}</td>
                <td className="px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {p.areas.map((a) => <span key={a} className="rounded-full bg-[#f2efef] px-[9px] py-[3px] text-[10.5px] font-semibold text-[#4a4547]">{a}</span>)}
                  </div>
                </td>
                <td className="px-3 text-[12px] whitespace-nowrap text-[var(--muted)]">{shortDate(p.date)}</td>
                <td className="px-3">
                  {p.authorized ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#19b96f" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-label="Sí"><path d="M4 12l5 5L20 6" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#edb4cc" strokeWidth={2} strokeLinecap="round" aria-label="No"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  )}
                </td>
                <td className="px-5"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">No hay prospectos con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
      <Pagination page={page} total={total} perPage={perPage} href={(n) => qs({ pagina: String(n) })} />
    </>
  );
}

async function LegacyTable({ q, page, qs }: { q?: string; page: number; qs: (p: Search) => string }) {
  const { items, total, perPage } = await legacyLeads(q, page);
  return (
    <>
      <p className="mt-3 text-[12px] text-[var(--muted)]">Leads importados de la versión 1. Son de solo consulta: no tienen resultado detallado ni seguimiento.</p>
      <Panel className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="border-b border-[var(--line)] bg-[var(--bg)]">
            <tr className={tableHead}>
              <th className="px-5 py-3 font-semibold">Prospecto</th>
              <th className="px-3 py-3 font-semibold">Distribuidor</th>
              <th className="px-3 py-3 font-semibold">Resumen</th>
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 font-semibold">Autorizó</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-b border-[#f2efef] align-top">
                <td className="px-5 py-3.5">
                  <div className="text-[13px] font-bold text-[var(--navy)]">{l.name}</div>
                  <div className="text-[11.5px] text-[#8a8587]">{l.email} · {l.phone}</div>
                </td>
                <td className="px-3 py-3.5 text-[12.5px] text-[#4a4547]">{l.distributorName ?? "—"}</td>
                <td className="max-w-[320px] px-3 py-3.5 text-[12px] leading-snug text-[var(--muted)]">{l.summary}</td>
                <td className="px-3 py-3.5 text-[12px] whitespace-nowrap text-[var(--muted)]">{shortDate(l.createdAt)}</td>
                <td className="px-5 py-3.5 text-[12px] font-semibold text-[#4a4547]">{l.advisor ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Pagination page={page} total={total} perPage={perPage} href={(n) => qs({ pagina: String(n) })} />
    </>
  );
}
