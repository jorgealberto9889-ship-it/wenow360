import Link from "next/link";
import { LEAD_STATUS, shortDate, type LeadStatus } from "@/lib/admin/format";
import { publicOrigin } from "@/lib/admin/origin";
import { distributorFunnel, prospectList, statusCounts } from "@/lib/admin/queries";
import { requireDistributor } from "@/lib/portal";
import { distributorStoreUrl } from "@/lib/store";
import { LinkActions, StoreLinkActions } from "./client";

const FILTERS: (LeadStatus | "")[] = ["", "nuevo", "contactado", "en_seguimiento", "convertido"];
const PER_PAGE = 20;

export default async function PortalHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireDistributor();
  const sp = await searchParams;
  const status = sp.estatus && sp.estatus in LEAD_STATUS ? (sp.estatus as LeadStatus) : "";
  const allTime = sp.periodo === "todo";
  const shown = Math.min(200, Math.max(PER_PAGE, Number(sp.ver) || PER_PAGE));
  const [origin, funnel, counts, list] = await Promise.all([
    publicOrigin(),
    distributorFunnel(me.slug, allTime ? "todo" : "30"),
    statusCounts(me.slug),
    prospectList({ distributor: me.slug, status: status || undefined, period: "todo", page: 1, perPage: shown }),
  ]);
  const link = `${origin}/d/${me.slug}`;
  const storeLink = distributorStoreUrl(me.slug, me.storeUrl);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const qs = (patch: Record<string, string>) => `/portal?${new URLSearchParams({ ...(status ? { estatus: status } : {}), ...(allTime ? { periodo: "todo" } : {}), ...patch })}`;

  // Cada paso muestra su porcentaje respecto al paso de referencia (base).
  const steps = [
    { label: "Visitas", value: funnel.visits, base: null },
    { label: "Inician", value: funnel.starts, base: funnel.visits },
    { label: "Completan", value: funnel.completed, base: funnel.starts },
    { label: "Piden contacto", value: funnel.authorized, base: funnel.completed },
    { label: "Clics a la tienda", value: funnel.store, base: funnel.completed },
  ];

  return (
    <>
      <section className="rounded-[22px] bg-[linear-gradient(140deg,#2e2e2e,var(--navy)_65%)] p-5 text-white shadow-[0_18px_40px_rgba(56,56,56,0.25)]">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[#e6a9c5] uppercase">Tu enlace personal</div>
        <div className="mt-1.5 font-mono text-[13.5px] break-all">{link.replace(/^https?:\/\//, "")}</div>
        <LinkActions url={link} name={me.displayName} />
      </section>

      <section className="mt-3 rounded-[22px] bg-white p-5 ring-1 ring-[var(--line)]">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">Tu enlace de la tienda</div>
        <div className="mt-1.5 font-mono text-[13.5px] break-all text-[var(--navy)]">{storeLink.replace(/^https?:\/\//, "")}</div>
        <p className="mt-2 text-[12.5px] leading-snug text-[var(--muted)]">
          Comparte este enlace. Las compras quedan registradas a tu nombre.
        </p>
        <StoreLinkActions url={storeLink} name={me.displayName} />
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-[var(--navy)]">Tu embudo</h2>
          <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-[var(--line)]">
            {[["30 días", false], ["Todo", true]].map(([label, all]) => (
              <Link key={String(label)} href={all ? qs({ periodo: "todo" }) : `/portal${status ? `?estatus=${status}` : ""}`}
                className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${allTime === all ? "bg-[var(--blue)] text-white" : "text-[var(--muted)]"}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {steps.map((s, i) => (
            <div key={s.label} className={`rounded-2xl px-2 py-3 text-center ring-1 ${i < 3 ? "col-span-2" : "col-span-3"} ${i === 4 ? "bg-[#fbeef4] ring-[#efc9da]" : "bg-white ring-[var(--line)]"}`}>
              <div className="text-[22px] font-extrabold text-[var(--navy)]">{s.value}</div>
              <div className="text-[10.5px] leading-tight font-semibold text-[var(--muted)]">{s.label}</div>
              {/* Visitas e inicios se miden desde hace poco: se oculta un porcentaje mayor a 100 % que solo refleja eso. */}
              {s.base !== null && s.base > 0 && (i === 4 || s.value <= s.base) && (
                <div className="mt-1 text-[10px] font-bold text-[var(--blue)]">{Math.round((s.value / s.base) * 100)}%{i >= 3 && " de completados"}</div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#8a8587]">«Clics a la tienda» cuenta cada vez que alguien toca «Comprar ahora» o «Comprar sin membresía» en su resultado. Las compras que se concretan se ven en la tienda.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-[15px] font-extrabold text-[var(--navy)]">Mis prospectos <span className="font-semibold text-[var(--muted)]">· {total}</span></h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const active = f === status;
            const n = f ? counts[f] ?? 0 : total;
            return (
              <Link key={f || "todos"} href={f ? `/portal?estatus=${f}${allTime ? "&periodo=todo" : ""}` : `/portal${allTime ? "?periodo=todo" : ""}`}
                className={`press shrink-0 rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold ${active ? "border-[var(--blue)] bg-[var(--blue)] text-white" : "border-[var(--line)] bg-white text-[#4a4547]"}`}>
                {f ? LEAD_STATUS[f].label : "Todos"} <span className="opacity-70">{n}</span>
              </Link>
            );
          })}
        </div>

        {list.items.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-6 text-center ring-1 ring-[var(--line)]">
            <p className="text-[14px] font-bold text-[var(--navy)]">{status ? "No hay prospectos con este estatus." : "Aún no tienes prospectos en WeNow 360 V2."}</p>
            {!status && <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">Comparte tu enlace: cada persona que haga su WeNow 360 aparecerá aquí.</p>}
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {list.items.map((p) => (
              <li key={p.id}>
                <Link href={`/portal/prospecto/${p.id}`} className="press flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fbeef4] text-[12px] font-bold text-[var(--blue)]">
                    {p.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-[var(--navy)]">{p.name}</span>
                    <span className="block text-[11.5px] text-[var(--muted)]">{shortDate(p.date)}{p.areas.length > 0 && ` · ${p.areas.join(", ")}`}</span>
                    {!p.authorized && <span className="mt-1 inline-block rounded-full bg-[#fff4df] px-2 py-0.5 text-[10.5px] font-bold text-[#8a6412]">No pidió contacto</span>}
                  </span>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: LEAD_STATUS[p.status].bg, color: LEAD_STATUS[p.status].color }}>
                    {LEAD_STATUS[p.status].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {list.total > list.items.length && (
          <Link href={qs({ ver: String(shown + PER_PAGE) })} scroll={false} className="press mt-3 block rounded-full bg-white py-3 text-center text-[13px] font-bold text-[var(--blue)] ring-1 ring-[var(--line)]">
            Ver más ({list.total - list.items.length})
          </Link>
        )}
      </section>
    </>
  );
}
