import { listPayments } from "@/lib/billing";
import { requireAdmin } from "@/lib/dal";
import { longDate as date, PaymentCards, periodLabel } from "../plan-sections";
import { PageHeader, Panel } from "../ui";

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const PAY_CHIP = { pagado: "bg-[#e5f8ef] text-[#087748]", pendiente: "bg-[#fff3d6] text-[#8a5a00]", vencido: "bg-[#fde8e6] text-[#b42318]" } as const;

export default async function Pagos() {
  await requireAdmin();
  const history = await listPayments();

  return (
    <>
      <PageHeader title="Pagos y facturación" subtitle="Tu plan, próximo pago e historial de pagos." />

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
