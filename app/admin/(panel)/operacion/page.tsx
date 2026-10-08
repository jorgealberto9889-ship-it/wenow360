import { LEAD_STATUS, shortDate } from "@/lib/admin/format";
import { operations } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/dal";
import { scanProvider } from "@/lib/scan-provider";
import { PageHeader, Panel, Stat } from "../ui";

const shenai = () => process.env.SCAN_PROVIDER === "shenai";
const SERVICES = () => [
  { name: "Base de datos", detail: "Turso", env: "TURSO_DATABASE_URL" },
  { name: "Correos", detail: "Resend", env: "RESEND_API_KEY" },
  shenai()
    ? { name: "Escaneo facial", detail: "Shen.AI", env: "SHENAI_ADMIN_KEY" }
    : { name: "Escaneo facial", detail: "VitalLens", env: "VITALLENS_API_KEY" },
  { name: "Narración con voz", detail: "Google Text-to-Speech", env: "GOOGLE_TTS_API_KEY" },
  { name: "Winnie", detail: "Google Gemini", env: "GEMINI_API_KEY" },
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
  const { emails, scans, audit, celia, monthScans } = await operations();
  const sent = emails.sent ?? 0;
  const failed = (emails.failed ?? 0) + (emails.bounced ?? 0);

  return (
    <>
      <PageHeader title="Operación" subtitle="Estado de los servicios, consumo y registro de cambios · últimos 30 días" />

      <Panel className="mt-6 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Servicios conectados</h2>
        <ul className="mt-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {SERVICES().map((s) => {
            const ok = Boolean(process.env[s.env]);
            return (
              <li key={s.name} className="flex items-center gap-3 rounded-xl border border-[#f2efef] p-3">
                <span className={`size-2.5 shrink-0 rounded-full ${ok ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} aria-hidden />
                <span>
                  <span className="block text-[13px] font-bold text-[var(--navy)]">{s.name}</span>
                  <span className="block text-[11.5px] text-[var(--muted)]">{s.detail} · {ok ? "configurado" : "sin configurar"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Correos enviados" value={sent} />
        <Stat label="Correos con error" value={failed} tone={failed ? "bad" : "good"} note={failed ? "Revisa la ficha del prospecto" : "Sin errores"} />
        <Stat label="Escaneos completados" value={scans.finished} note={scanProvider() === "shenai" ? `${scans.sessions} iniciados · Shen.AI` : `${scans.sessions} iniciados · ${scans.requests} llamadas a VitalLens`} />
        {scanProvider() === "shenai" && (
          <Stat label="Escaneos del mes (plan Shen.AI)" value={`${monthScans} / 500`} tone={monthScans >= 500 ? "bad" : "good"} note={monthScans >= 500 ? "Plan agotado: cada escaneo extra se cobra (0,20 €)" : monthScans >= 400 ? "Cerca del límite del plan" : "Mediciones iniciadas este mes"} />
        )}
        <Stat label="Conversaciones con Winnie" value={celia.conversations} note={`${celia.questions} preguntas`} />
      </div>

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
