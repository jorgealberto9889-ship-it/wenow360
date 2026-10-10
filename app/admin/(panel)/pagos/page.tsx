import { listPayments } from "@/lib/billing";
import { nextCharge, type ChargeState } from "@/lib/billing-status";
import { requireAdmin } from "@/lib/dal";
import { loadSettings } from "@/lib/usage";
import { netFee, renewalDate } from "@/lib/usage-costs";
import { PageHeader, Panel } from "../ui";

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const date = (d: Date) => d.toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const periodLabel = (k: string) => (/^\d{4}-\d{2}$/.test(k) ? `${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}` : k.replace("-anual", " · anual"));

const STATE: Record<ChargeState, { label: string; chip: string }> = {
  sin_cobro: { label: "Sin cobro todavía", chip: "bg-[#f1ecef] text-[#5a5456]" },
  al_corriente: { label: "Al corriente", chip: "bg-[#e5f8ef] text-[#087748]" },
  pendiente: { label: "Pendiente", chip: "bg-[#fff3d6] text-[#8a5a00]" },
  vencido: { label: "Vencido", chip: "bg-[#fde8e6] text-[#b42318]" },
};
const PAY_CHIP = { pagado: "bg-[#e5f8ef] text-[#087748]", pendiente: "bg-[#fff3d6] text-[#8a5a00]", vencido: "bg-[#fde8e6] text-[#b42318]" } as const;

export default async function Pagos() {
  await requireAdmin();
  const [settings, history] = await Promise.all([loadSettings(), listPayments()]);
  const p = settings.plan;
  const net = netFee(p.priceWithIva > 0 ? p : { ...p, priceWithIva: 0 });
  const iva = p.priceWithIva - net;
  const charge = nextCharge(new Date(), settings.billing, history);
  const st = STATE[charge.state];
  const link = settings.billing.paymentLink;
  const a = settings.annual;

  return (
    <>
      <PageHeader title="Pagos y facturación" subtitle="Tu plan, próximo pago e historial de pagos." />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--muted)] uppercase">Tu plan</div>
          <div className="mt-2 text-[28px] font-extrabold text-[var(--navy)]">{mxn(p.priceWithIva)}<span className="text-[14px] font-semibold text-[var(--muted)]"> / mes</span></div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">IVA incluido ({mxn(net)} + IVA {mxn(iva)})</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-[#4a4547]">
            <li>· Hasta {p.scans.toLocaleString("es-MX")} escaneos faciales al mes</li>
            <li>· Hasta {p.emails.toLocaleString("es-MX")} correos automáticos al mes</li>
            <li>· Winnie con uso de referencia de ~{p.winnieReference.toLocaleString("es-MX")} respuestas al mes</li>
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--muted)] uppercase">Próximo pago</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[28px] font-extrabold text-[var(--navy)]">{mxn(p.priceWithIva)}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${st.chip}`}>{st.label}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-[#4a4547]">
            {charge.state === "sin_cobro" ? `Tu plan comienza a cobrarse en ${periodLabel(charge.periodKey)}. ` : `Plan de ${periodLabel(charge.periodKey)}. `}
            Fecha límite: <strong>{date(charge.dueDate)}</strong>
            {charge.state === "vencido" ? ` (venció hace ${Math.abs(charge.daysToDue)} días)` : charge.daysToDue >= 0 ? ` (en ${charge.daysToDue} días)` : ""}.
          </p>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="press mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white">
              {charge.state === "al_corriente" ? "Pagar por adelantado" : "Pagar ahora"} →
            </a>
          ) : (
            <p className="mt-4 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-[12px] leading-snug text-[var(--muted)]">Tu enlace de pago aparecerá aquí. Si ya te toca pagar, pídelo a Órbita Digital.</p>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--muted)] uppercase">Dominio y hosting</div>
          <div className="mt-2 text-[28px] font-extrabold text-[var(--navy)]">{mxn(a.amountMxn)}<span className="text-[14px] font-semibold text-[var(--muted)]"> / año</span></div>
          <p className="mt-1 text-[12.5px] text-[#4a4547]">{a.freeYears > 0 ? `Incluido el primer año. ` : ""}Primera renovación: <strong>{date(renewalDate(a))}</strong>.</p>
          <p className="mt-1 text-[11.5px] text-[var(--muted)]">Se renueva automáticamente cada año.</p>
        </Panel>
      </div>

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Historial de pagos</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-[var(--muted)]">Todavía no hay pagos registrados.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
              <thead className="font-mono text-[10px] tracking-[0.05em] text-[var(--muted)] uppercase">
                <tr><th className="py-2 font-semibold">Concepto</th><th className="py-2 font-semibold">Periodo</th><th className="py-2 font-semibold">Fecha de pago</th><th className="py-2 text-right font-semibold">Monto</th><th className="py-2 pl-4 font-semibold">Estado</th><th className="py-2 font-semibold">Factura</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-[#f2efef]">
                    <td className="py-2.5 font-semibold text-[#4a4547]">{h.concept}</td>
                    <td className="py-2.5 text-[var(--muted)] capitalize">{periodLabel(h.periodKey)}</td>
                    <td className="py-2.5 text-[var(--muted)]">{h.paidAt ? date(new Date(h.paidAt)) : "—"}</td>
                    <td className="py-2.5 text-right font-bold text-[var(--navy)]">{mxn(h.amountMxn)}</td>
                    <td className="py-2.5 pl-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${PAY_CHIP[h.status]}`}>{h.status}</span></td>
                    <td className="py-2.5">{h.invoiceUrl ? <a href={h.invoiceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--blue)]">Ver factura</a> : <span className="text-[var(--muted)]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-[12px] text-[var(--muted)]">¿Necesitas factura? Solicítala a Órbita Digital indicando tus datos fiscales y el periodo.</p>
    </>
  );
}
