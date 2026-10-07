import Image from "next/image";
import Link from "next/link";
import { LINE_STYLE } from "@/lib/admin/format";
import { catalog } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/dal";
import { toggleProduct } from "../actions";
import { Toggle } from "../controls";
import { PageHeader, Panel } from "../ui";
import { PriceEditor } from "./price-editor";

const TABS = [["", "Todos"], ["nutriday_plus", "NutriDay Plus"], ["club_wenow", "Club WeNow"]] as const;

// Productos que el motor no sugiere en el kit, aunque estén activos (ninguno por ahora).
const NOT_IN_KIT: Record<string, string> = {};

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const line = (await searchParams).linea ?? "";
  const all = await catalog();
  const products = line ? all.filter((p) => p.line === line) : all;

  return (
    <>
      <PageHeader title="Catálogo" subtitle={`${all.length} productos · ${all.filter((p) => p.active).length} activos · fuente vigente de precios para resultados y Winnie`} />

      <div className="mt-5 flex flex-wrap gap-1.5">
        {TABS.map(([v, label]) => (
          <Link
            key={v}
            href={v ? `/admin/catalogo?linea=${v}` : "/admin/catalogo"}
            className={`press rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold ${line === v ? "border-[var(--blue)] bg-[var(--blue)] text-white" : "border-[var(--line)] bg-white text-[#4a4547]"}`}
          >
            {label} <span className="opacity-70">{v ? all.filter((p) => p.line === v).length : all.length}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {products.map((p) => (
          <Panel key={p.id} className={`flex flex-col overflow-hidden ${p.active ? "" : "opacity-70"}`}>
            <div className="relative flex h-[150px] items-center justify-center bg-[radial-gradient(circle_at_50%_60%,#ffffff,#eaf1fb_80%)]">
              <span className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.05em] uppercase" style={{ background: LINE_STYLE[p.line].bg, color: LINE_STYLE[p.line].color }}>
                {LINE_STYLE[p.line].label}
              </span>
              <span className="absolute top-3 right-3">
                <Toggle on={p.active === 1} label={`${p.active ? "Desactivar" : "Activar"} ${p.name}`} action={toggleProduct.bind(null, p.id)} />
              </span>
              {p.imageUrl && <Image src={p.imageUrl} alt={p.name} width={200} height={200} className="h-[110px] w-auto object-contain" />}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <div className="text-[10.5px] font-bold tracking-[0.04em] text-[var(--blue)] uppercase">{p.eyebrow}</div>
                <div className="text-[15px] font-bold text-[var(--navy)]">{p.name}</div>
                <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                  {p.active ? "Activo" : "Inactivo: no aparece en resultados ni en Winnie"} · sugerido {p.recommended} {p.recommended === 1 ? "vez" : "veces"}
                </div>
                {NOT_IN_KIT[p.id] && <div className="mt-1 text-[11.5px] font-semibold text-[#916000]">{NOT_IN_KIT[p.id]}</div>}
              </div>
              <div className="mt-auto border-t border-[#f2efef] pt-3">
                <PriceEditor id={p.id} publicPrice={p.publicPrice} distributorPrice={p.distributorPrice} />
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <p className="mt-3 text-[11.5px] text-[#8a8587]">
        Los cambios de precio aplican a los resultados nuevos. Los resultados ya enviados conservan los precios con los que se generaron.
      </p>
    </>
  );
}
