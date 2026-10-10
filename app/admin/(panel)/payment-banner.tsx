import Link from "next/link";
import { listPayments } from "@/lib/billing";
import { nextCharge } from "@/lib/billing-status";
import { loadSettings } from "@/lib/usage";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const date = (d: Date) => d.toLocaleString("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });

// Aviso en todas las pantallas del panel: recordatorio unos días antes del límite y aviso de pago vencido.
// El servicio nunca se detiene por falta de pago; solo se muestra el aviso hasta que se registre el pago.
export async function PaymentBanner() {
  const [settings, payments] = await Promise.all([loadSettings(), listPayments()]);
  const c = nextCharge(new Date(), settings.billing, payments);
  const month = MONTHS[Number(c.periodKey.slice(5)) - 1];
  const upcoming = c.state === "pendiente" && c.daysToDue <= settings.billing.reminderDays;
  if (!upcoming && c.state !== "vencido") return null;

  const overdue = c.state === "vencido";
  const link = settings.billing.paymentLink;
  return (
    <div role="status" className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-[13px] leading-snug ${overdue ? "border-[#f0b8b2] bg-[#fdeceb] text-[#7a1d17]" : "border-[#f0dca0] bg-[#fff8e6] text-[#6b4a00]"}`}>
      <span>
        <strong>{overdue ? "Pago vencido." : "Recordatorio de pago."}</strong>{" "}
        {overdue
          ? `Tu plan de ${month} venció el ${date(c.dueDate)}. Tu servicio sigue activo; regulariza tu pago cuando puedas.`
          : `Tu plan de ${month} vence el ${date(c.dueDate)}${c.daysToDue === 0 ? " (hoy)" : c.daysToDue === 1 ? " (mañana)" : ` (en ${c.daysToDue} días)`}.`}
      </span>
      <span className="flex items-center gap-2">
        <Link href="/admin/pagos" className="press rounded-full border border-current/30 px-3.5 py-1.5 text-[12px] font-bold">Ver detalle</Link>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="press rounded-full bg-[var(--navy)] px-3.5 py-1.5 text-[12px] font-bold text-white">Pagar ahora</a>}
      </span>
    </div>
  );
}
