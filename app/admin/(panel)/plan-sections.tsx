import Link from "next/link";
import { operations } from "@/lib/admin/queries";
import { listPayments } from "@/lib/billing";
import { nextCharge, type ChargeState } from "@/lib/billing-status";
import { monthReport } from "@/lib/usage";
import { netFee, renewalDate } from "@/lib/usage-costs";
import { Panel, Stat } from "./ui";

// Secciones del plan que se repiten en Resumen, Operación y Pagos: consumo del mes, actividad de los servicios y
// tarjetas de pago. Cada una carga sus propios datos.

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const longDate = (d: Date) => d.toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const periodLabel = (k: string) => (/^\d{4}-\d{2}$/.test(k) ? `${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}` : k.replace("-anual", " · anual"));

const STATE: Record<ChargeState, { label: string; chip: string }> = {
  sin_cobro: { label: "Sin cobro todavía", chip: "bg-[#f1ecef] text-[#5a5456]" },
  al_corriente: { label: "Al corriente", chip: "bg-[#e5f8ef] text-[#087748]" },
  pendiente: { label: "Pendiente", chip: "bg-[#fff3d6] text-[#8a5a00]" },
  vencido: { label: "Vencido", chip: "bg-[#fde8e6] text-[#b42318]" },
};

const kicker = "font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--muted)] uppercase";

export async function PlanUsagePanel({ className = "", report }: { className?: string; report?: Awaited<ReturnType<typeof monthReport>> }) {
  const { costs } = report ?? (await monthReport());
  return (
    <Panel className={`p-5 ${className}`}>
      <h2 className="text-[14px] font-bold text-[var(--navy)]">Tu plan este mes</h2>
      <p className="mt-1 text-[12.5px] text-[var(--muted)]">Consumo de los cupos incluidos. Se reinicia cada mes.</p>
      <ul className="mt-3.5 grid gap-4 md:grid-cols-3">
        {costs.planUsage.map((x) => (
          <li key={x.label}>
            <div className="flex justify-between gap-3 text-[12.5px]"><span className="font-semibold text-[#4a4547]">{x.label}</span><span className="shrink-0 text-[var(--muted)]">{x.used.toLocaleString("es-MX")} {x.reference ? "· aprox." : "de"} {x.limit.toLocaleString("es-MX")}</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f2efef]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, x.pct)}%`, background: x.reference ? "var(--blue)" : x.pct >= 100 ? "var(--red)" : x.pct >= 80 ? "#e0a100" : "var(--blue)" }} /></div>
            {x.reference && <p className="mt-1 text-[11px] text-[var(--muted)]">Uso de referencia, no es un límite. Si el consumo supera de forma sostenida lo previsto, se revisa el plan.</p>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// Correos, escaneos y Winnie en los últimos 30 días.
export async function ServiceStats({ className = "", data }: { className?: string; data?: Awaited<ReturnType<typeof operations>> }) {
  const { emails, scans, celia } = data ?? (await operations());
  const sent = emails.sent ?? 0;
  const failed = (emails.failed ?? 0) + (emails.bounced ?? 0);
  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${className}`}>
      <Stat label="Correos enviados" value={sent} note="Últimos 30 días" />
      <Stat label="Correos con error" value={failed} tone={failed ? "bad" : "good"} note={failed ? "Revisa la ficha del prospecto" : "Sin errores"} />
      <Stat label="Escaneos completados" value={scans.finished} note={`${scans.sessions} iniciados · últimos 30 días`} />
      <Stat label="Conversaciones con Winnie" value={celia.conversations} note={`${celia.questions} ${celia.questions === 1 ? "pregunta" : "preguntas"}`} />
    </div>
  );
}

// Tarjetas de plan, próximo pago y dominio.
export async function PaymentCards({ className = "" }: { className?: string }) {
  const { settings } = await monthReport();
  const history = await listPayments();
  const p = settings.plan;
  const net = netFee(p.priceWithIva > 0 ? p : { ...p, priceWithIva: 0 });
  const iva = p.priceWithIva - net;
  const charge = nextCharge(new Date(), settings.billing, history);
  const st = STATE[charge.state];
  const link = settings.billing.paymentLink;
  const a = settings.annual;

  return (
    <div className={`grid gap-4 lg:grid-cols-3 ${className}`}>
      <Panel className="p-5">
        <div className={kicker}>Tu plan</div>
        <div className="mt-2 text-[28px] font-extrabold text-[var(--navy)]">{mxn(p.priceWithIva)}<span className="text-[14px] font-semibold text-[var(--muted)]"> / mes</span></div>
        <p className="mt-1 text-[12px] text-[var(--muted)]">IVA incluido ({mxn(net)} + IVA {mxn(iva)})</p>
        <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-[#4a4547]">
          <li>· Hasta {p.scans.toLocaleString("es-MX")} escaneos faciales al mes</li>
          <li>· Hasta {p.emails.toLocaleString("es-MX")} correos automáticos al mes</li>
          <li>· Winnie con uso de referencia de ~{p.winnieReference.toLocaleString("es-MX")} respuestas al mes</li>
        </ul>
      </Panel>

      <Panel className="p-5">
        <div className={kicker}>Próximo pago</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[28px] font-extrabold text-[var(--navy)]">{mxn(p.priceWithIva)}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${st.chip}`}>{st.label}</span>
        </div>
        <p className="mt-1 text-[12.5px] text-[#4a4547]">
          {charge.state === "sin_cobro" ? `Tu plan comienza a cobrarse en ${periodLabel(charge.periodKey)}. ` : `Plan de ${periodLabel(charge.periodKey)}. `}
          Fecha límite: <strong>{longDate(charge.dueDate)}</strong>
          {charge.state === "vencido" ? ` (venció hace ${Math.abs(charge.daysToDue)} días)` : charge.daysToDue >= 0 ? ` (en ${charge.daysToDue} días)` : ""}.
        </p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="press mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white">
            {charge.state === "al_corriente" || charge.state === "sin_cobro" ? "Pagar por adelantado" : "Pagar ahora"} →
          </a>
        ) : (
          <p className="mt-4 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-[12px] leading-snug text-[var(--muted)]">Tu enlace de pago aparecerá aquí. Si ya te toca pagar, pídelo a Órbita Digital.</p>
        )}
      </Panel>

      <Panel className="p-5">
        <div className={kicker}>Dominio y hosting</div>
        <div className="mt-2 text-[28px] font-extrabold text-[var(--navy)]">{mxn(a.amountMxn)}<span className="text-[14px] font-semibold text-[var(--muted)]"> / año</span></div>
        <p className="mt-1 text-[12.5px] text-[#4a4547]">{a.freeYears > 0 ? `Incluido el primer año. ` : ""}Primera renovación: <strong>{longDate(renewalDate(a))}</strong>.</p>
        <p className="mt-1 text-[11.5px] text-[var(--muted)]">Se renueva automáticamente cada año.</p>
      </Panel>
    </div>
  );
}

export function SectionTitle({ title, href, cta }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[16px] font-extrabold text-[var(--navy)]">{title}</h2>
      {href && <Link href={href} className="-my-2 py-2.5 text-[12.5px] font-semibold text-[var(--blue)]">{cta} →</Link>}
    </div>
  );
}
