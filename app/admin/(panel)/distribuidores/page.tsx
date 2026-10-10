import Link from "next/link";
import { publicOrigin } from "@/lib/admin/origin";
import { distributorStoreUrl } from "@/lib/store";
import { distributorList } from "@/lib/admin/queries";
import { longDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/dal";
import { toggleDistributor } from "../actions";
import { CopyButton, Toggle } from "../controls";
import { InviteAll } from "./portal-access";
import { Applications } from "./applications";
import { pendingApplications } from "@/lib/admin/queries";
import { registrationCode } from "@/lib/registration";
import { Avatar, fieldClass, PageHeader, Panel, tableHead } from "../ui";

// Columnas de la vista de tabla (xl en adelante); abajo de xl cada fila es una tarjeta.
const ROW = "px-4 sm:px-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_72px_72px_44px_92px_52px_32px] xl:items-center xl:gap-3";
const AVATAR = ["#a51959", "#d93025", "#19b96f", "#d3427e", "#0d9a56", "#916000"];

export default async function Distribuidores({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [list, origin, applications, code] = await Promise.all([
    distributorList({ q: sp.q, state: sp.estado, sort: sp.orden }), publicOrigin(), pendingApplications(), registrationCode(),
  ]);
  const active = list.filter((d) => d.active).length;

  return (
    <>
      <PageHeader
        title="Distribuidores"
        subtitle={`${list.length} ${sp.q || sp.estado ? "encontrados" : "registrados"} · ${active} activos · ${list.length - active} inactivos`}
        actions={
          <>
          <InviteAll pendingCount={list.filter((d) => d.active && !d.portal && d.email && d.slug !== "wenow").length} />
          <Link href="/admin/distribuidores/nuevo" className="press flex items-center gap-[7px] rounded-[10px] bg-[var(--blue)] px-4 py-[9px] text-[13px] font-bold text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
            Agregar distribuidor
          </Link>
          </>
        }
      />

      <Applications link={`${origin}/registro/${code}`} pending={applications} />

      <form className="mt-5 flex flex-wrap items-center gap-2.5">
        <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, correo o enlace" className={`${fieldClass} min-w-[220px] flex-1 sm:max-w-[340px]`} aria-label="Buscar" />
        <select name="estado" defaultValue={sp.estado ?? ""} className={fieldClass} aria-label="Estado">
          <option value="">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        <select name="orden" defaultValue={sp.orden ?? ""} className={fieldClass} aria-label="Ordenar">
          <option value="">Más evaluaciones</option>
          <option value="nombre">Nombre</option>
          <option value="recientes">Más recientes</option>
        </select>
        <button className="press rounded-[10px] bg-[var(--blue)] px-4 py-2.5 text-[13px] font-bold text-white">Filtrar</button>
      </form>

      {/* Lista sin scroll horizontal: tabla en pantallas anchas y tarjetas en las demás. */}
      <Panel className="mt-4">
        <div className={`${tableHead} ${ROW} hidden border-b border-[var(--line)] bg-[var(--bg)] py-3 xl:grid`}>
          <span>Distribuidor</span>
          <span>Enlaces</span>
          <span className="text-center">Evaluaciones</span>
          <span className="text-center">Contactos</span>
          <span>Portal</span>
          <span>Activo</span>
          <span className="sr-only">Editar</span>
        </div>
        <ul>
          {list.map((d, i) => {
            const corporate = d.slug === "wenow";
            const portal = (
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap ${d.portal ? "bg-[#e5f8ef] text-[#087748]" : "bg-[#f2efef] text-[#8a8587]"}`}>{d.portal ? "Con acceso" : "Sin acceso"}</span>
            );
            const toggle = (
              <Toggle on={d.active === 1} disabled={corporate} label={`${d.active ? "Desactivar" : "Activar"} a ${d.displayName}`} action={toggleDistributor.bind(null, d.id)} />
            );
            const edit = (
              <Link href={`/admin/distribuidores/${d.id}`} aria-label={`Editar a ${d.displayName}`} className="press flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-[var(--line)] bg-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f6a6c" strokeWidth={1.6} strokeLinejoin="round" aria-hidden><path d="M4 20h4l11-11-4-4L4 16v4Z" /></svg>
              </Link>
            );
            return (
              <li key={d.id} className={`border-b border-[#f2efef] py-3.5 last:border-b-0 hover:bg-[var(--bg)] xl:grid ${ROW}`}>
                <div className="flex min-w-0 items-center gap-[11px]">
                  <Avatar name={d.displayName} bg={AVATAR[i % AVATAR.length]} color="#fff" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold break-words text-[var(--navy)]">{d.displayName}{corporate && <span className="ml-1.5 text-[11px] font-semibold text-[var(--muted)]">(corporativo)</span>}</div>
                    <div className="truncate text-[11.5px] text-[#8a8587]">{d.email ?? "Sin correo"}</div>
                    <div className="text-[11.5px] text-[#8a8587]">WhatsApp {d.whatsapp} · Alta {longDate(d.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2.5 xl:hidden">{toggle}{edit}</div>
                </div>
                <div className="mt-2.5 min-w-0 space-y-1 pl-[45px] xl:mt-0 xl:pl-0">
                  <CopyButton text={`${origin}/d/${d.slug}`}>/d/{d.slug}</CopyButton>
                  <CopyButton text={distributorStoreUrl(d.slug, d.storeUrl)}>enlace de la tienda</CopyButton>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pl-[45px] text-[12px] text-[var(--muted)] xl:hidden">
                  <span><b className="text-[var(--navy)]">{d.biochecks}</b> evaluaciones</span>
                  <span><b className="text-[var(--navy)]">{d.contacts}</b> contactos</span>
                  {portal}
                </div>
                <div className="hidden text-center text-[13px] font-bold text-[var(--navy)] xl:block">{d.biochecks}</div>
                <div className="hidden text-center text-[13px] font-bold text-[var(--navy)] xl:block">{d.contacts}</div>
                <div className="hidden xl:block">{portal}</div>
                <div className="hidden xl:block">{toggle}</div>
                <div className="hidden xl:block">{edit}</div>
              </li>
            );
          })}
          {list.length === 0 && <li className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">No hay distribuidores con estos filtros.</li>}
        </ul>
      </Panel>
      <p className="mt-3 text-[11.5px] text-[#8a8587]">
        Al desactivar a un distribuidor, su enlace sigue funcionando pero las evaluaciones se atribuyen al corporativo. El corporativo no se puede desactivar.
      </p>
    </>
  );
}
