import { listPayments } from "@/lib/billing";
import { requireAdmin } from "@/lib/dal";
import { longDate as date, PaymentCards, periodLabel } from "../plan-sections";
import { PageHeader, Panel } from "../ui";

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const PAY_CHIP = { pagado: "bg-[#e5f8ef] text-[#087748]", pendiente: "bg-[#fff3d6] text-[#8a5a00]", vencido: "bg-[#fde8e6] text-[#b42318]" } as const;

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  ok: { tone: "ok", text: "¡Gracias! Recibimos tu pago. En unos instantes aparecerá en el historial." },
  pendiente: { tone: "warn", text: "Tu pago está pendiente de confirmación en Mercado Pago. Cuando se apruebe, se registrará solo." },
  error: { tone: "warn", text: "No se completó el pago. Puedes intentarlo de nuevo cuando quieras." },
  error_enlace: { tone: "warn", text: "No pudimos generar tu enlace de pago. Inténtalo de nuevo en unos minutos o avisa a Órbita Digital." },
  sin_configurar: { tone: "warn", text: "El cobro en línea todavía no está activo. Pide tu enlace de pago a Órbita Digital." },
};

export default async function Pagos({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  await requireAdmin();
  const notice = NOTICES[(await searchParams).pago ?? ""];
  const history = await listPayments();

  return (
    <>
      <PageHeader title="Pagos y facturación" subtitle="Tu plan, próximo pago e historial de pagos." />

      {notice && (
        <div role="status" className={`mt-5 rounded-2xl border px-4 py-3 text-[13px] leading-snug ${notice.tone === "ok" ? "border-[#b7e6cf] bg-[#e5f8ef] text-[#087748]" : "border-[#f1d9a6] bg-[#fff6df] text-[#8a5a00]"}`}>{notice.text}</div>
      )}

      <PaymentCards className="mt-6" />

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
