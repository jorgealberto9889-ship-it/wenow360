import { LEAD_STATUS, shortDate } from "@/lib/admin/format";
import { operations } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/dal";
import { monthReport } from "@/lib/usage";
import { renewalDate } from "@/lib/usage-costs";
import { scanProvider } from "@/lib/scan-provider";
import { PlanUsagePanel, ServiceStats } from "../plan-sections";
import { PageHeader, Panel } from "../ui";

// Servicios que hacen funcionar WeNow 360. Se muestran con su función para que se vea el valor de la plataforma; los
// proveedores y la configuración (claves, variables, cuentas) nunca se exponen en pantalla.
type Service = { name: string; value: string; active: boolean };
const SERVICES = (domainNote: string): Service[] => [
  { name: "Alojamiento y entrega", value: "La plataforma está en línea 24/7, con entrega rápida y actualizaciones sin interrupciones.", active: true },
  { name: "Dominio y seguridad HTTPS", value: `Dirección propia con certificado de seguridad que protege los datos de cada persona. ${domainNote}`, active: true },
  { name: "Base de datos", value: "Resguarda evaluaciones, prospectos y resultados de forma segura y con alta disponibilidad.", active: Boolean(process.env.TURSO_DATABASE_URL) },
  { name: "Escaneo facial con la cámara (rPPG)", value: "Mide pulso, variabilidad, respiración, estrés y actividad parasimpática sin sensores ni contacto.", active: scanProvider() !== null },
  { name: "Winnie, asistente con IA", value: "Resuelve dudas sobre productos, ingredientes y hábitos, a cualquier hora.", active: Boolean(process.env.GEMINI_API_KEY) },
  { name: "Narración del resultado con voz", value: "Explica el resultado en voz alta, sección por sección, para una experiencia más cercana.", active: Boolean(process.env.GOOGLE_TTS_API_KEY) },
  { name: "Correos automáticos", value: "Envía el resultado a cada persona, avisa a los asesores y programa recordatorios.", active: Boolean(process.env.RESEND_API_KEY) },
  { name: "Respaldo del código", value: "Cada versión del sistema queda guardada y se puede restaurar.", active: true },
];

const ACTIONS: Record<string, string> = {
  login: "Inició sesión en el panel",
  distributor_created: "Agregó un distribuidor",
  distributor_updated: "Editó un distribuidor",
  distributor_activated: "Activó a un distribuidor",
  distributor_deactivated: "Desactivó a un distribuidor",
  product_activated: "Activó un producto",
  product_deactivated: "Desactivó un producto",
  product_prices_updated: "Cambió precios de un producto",
  prospects_exported: "Exportó prospectos",
  portal_invited: "Invitó a un distribuidor al portal",
  application_approved: "Aprobó una solicitud de registro (nuevo distribuidor)",
  application_rejected: "Rechazó una solicitud de registro",
  purchase_converted: "Un prospecto compró en la tienda (pasó a Convertido)",
  portal_temp_password: "Generó una contraseña temporal del portal",
  portal_revoked: "Quitó el acceso al portal a un distribuidor",
  portal_login: "Un distribuidor entró a su portal",
  portal_password_created: "Un distribuidor creó su contraseña",
  portal_password_reset: "Un distribuidor restableció su contraseña",
  portal_password_changed: "Un distribuidor cambió su contraseña",
  portal_push_enabled: "Un distribuidor activó los avisos en su celular",
  portal_reset_requested: "Un distribuidor pidió restablecer su contraseña",
};
const describe = (action: string, entityId: string | null) => {
  if (action.startsWith("prospect_status:")) {
    const s = action.split(":")[1] as keyof typeof LEAD_STATUS;
    return `Cambió un prospecto a «${LEAD_STATUS[s]?.label ?? s}»`;
  }
  const base = ACTIONS[action] ?? action;
  if (action === "prospects_exported") return `${base} (${entityId} registros)`;
  if (action.startsWith("product_") && entityId) return `${base}: ${entityId}`;
  return base;
};

export default async function Operacion() {
  await requireAdmin();
  const [ops, report] = await Promise.all([operations(), monthReport()]);
  const { audit } = ops;
  const settings = report.settings;
  const a = settings.annual;
  const domainNote = a.amountMxn > 0 ? `Incluido${a.freeYears > 0 ? ` el primer año; renovación anual de $${a.amountMxn.toLocaleString("es-MX")} MXN a partir del ${renewalDate(a).toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}` : ""}.` : "";

  return (
    <>
      <PageHeader title="Operación" subtitle="Estado de los servicios, consumo y registro de cambios · últimos 30 días" />

      <Panel className="mt-6 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Servicios incluidos en tu plan</h2>
        <p className="mt-1 text-[12.5px] text-[var(--muted)]">Tecnología que opera WeNow 360 todos los días, mantenida y monitoreada por Órbita Digital.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SERVICES(domainNote).map((s) => (
            <li key={s.name} className="flex items-start gap-3 rounded-xl border border-[#f2efef] p-3.5">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${s.active ? "bg-[var(--green)]" : "bg-[#e0a100]"}`} aria-hidden />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-bold text-[var(--navy)]">{s.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${s.active ? "bg-[#e5f8ef] text-[#087748]" : "bg-[#fff3d6] text-[#8a5a00]"}`}>{s.active ? "Activo" : "En activación"}</span>
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-[#4a4547]">{s.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <PlanUsagePanel className="mt-4" report={report} />
      <ServiceStats className="mt-4" data={ops} />

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Registro de cambios</h2>
        {audit.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-[var(--muted)]">Sin movimientos todavía.</p>
        ) : (
          <ul className="mt-3">
            {audit.map((a, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 border-t border-[#f2efef] py-2.5 text-[12.5px]">
                <span className="w-[90px] shrink-0 text-[var(--muted)]">{shortDate(a.createdAt)}</span>
                <span className="w-[200px] shrink-0 truncate font-semibold text-[#4a4547]">{a.actor ?? (a.actorType === "system" ? "Sistema" : a.actorType)}</span>
                <span className="text-[#4a4547]">{describe(a.action, a.entityId)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
