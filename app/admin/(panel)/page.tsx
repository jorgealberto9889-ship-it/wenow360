import Link from "next/link";
import { overview } from "@/lib/admin/queries";
import { parsePeriod, pct, PERIODS, shortDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/dal";
import { Avatar, Bars, PageHeader, Panel, PeriodSelect, Stat, StatusBadge } from "./ui";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const period = parsePeriod((await searchParams).dias);
  const { counts, areas, products, recent } = await overview(period);
  const c = {
    completed: Number(counts?.completed ?? 0),
    authorized: Number(counts?.authorized ?? 0),
    scans: Number(counts?.scans ?? 0),
    emailFailed: Number(counts?.emailFailed ?? 0),
    celia: Number(counts?.celia ?? 0),
    active: Number(counts?.activeDistributors ?? 0),
    inactive: Number(counts?.inactiveDistributors ?? 0),
    storeClicks: Number(counts?.storeClicks ?? 0),
  };

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={`Vista general de WeNow 360 · ${PERIODS[period].toLowerCase()}`}
        actions={
          <form className="flex gap-2">
            <PeriodSelect value={period} />
            <button className="press rounded-[10px] bg-[var(--blue)] px-4 text-[13px] font-bold text-white">Ver</button>
          </form>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Evaluaciones completadas" value={c.completed} />
        <Stat label="Contactos autorizados" value={c.authorized} note={`${pct(c.authorized, c.completed)}% de completados`} />
        <Stat label="Hicieron escaneo" value={`${pct(c.scans, c.completed)}%`} note={`${c.scans} de ${c.completed}`} />
        <Stat label="Clics a la tienda" value={c.storeClicks} note="«Comprar ahora» y «Comprar sin membresía»" />
        <Stat label="Hablaron con Winnie" value={c.celia} note={`${pct(c.celia, c.completed)}% de completados`} />
        <Stat label="Distribuidores activos" value={c.active} note={`${c.inactive} inactivos`} />
        <Stat
          label="Errores de correo"
          value={c.emailFailed}
          note={c.emailFailed ? <Link href="/admin/operacion" className="underline">Revisar en Operación</Link> : "Todo en orden"}
          tone={c.emailFailed ? "bad" : "good"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Bars title="Áreas de bienestar más frecuentes" items={areas} empty="Aún no hay evaluaciones en este periodo." />
        <Bars
          title="Productos más sugeridos"
          items={products.map((p) => ({ label: p.name, n: p.n, color: "var(--blue)" }))}
          empty="Aún no hay recomendaciones en este periodo."
        />
      </div>

      <Panel className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Prospectos recientes</h2>
          <Link href="/admin/prospectos" className="text-[12.5px] font-semibold text-[var(--blue)]">Ver todos →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-[12.5px] text-[var(--muted)]">Aún no hay prospectos en este periodo.</p>
        ) : (
          <ul className="mt-3.5">
            {recent.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/prospectos/${r.id}`} className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-[#f2efef] py-[11px] hover:bg-[var(--bg)]">
                  <Avatar name={r.name} />
                  <span className="min-w-[140px] flex-1 text-[13px] font-semibold text-[var(--navy)]">{r.name}</span>
                  <span className="w-40 truncate text-[12.5px] text-[var(--muted)]">{r.distributorName ?? r.distributorSlug}</span>
                  <span className="w-[90px] text-[12.5px] text-[var(--muted)]">{shortDate(r.date)}</span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
