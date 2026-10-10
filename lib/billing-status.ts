// Estado del cobro mensual del cliente. Función pura para poder probarla.
export type PaymentLite = { periodKey: string; status: "pendiente" | "pagado" | "vencido" };

export type ChargeState = "sin_cobro" | "al_corriente" | "pendiente" | "vencido";

export type NextCharge = {
  state: ChargeState;
  periodKey: string; // mes que se cobra
  dueDate: Date; // fecha límite de pago de ese mes
  daysToDue: number; // negativo si ya pasó
};

const key = (y: number, m0: number) => `${new Date(Date.UTC(y, m0, 1)).getUTCFullYear()}-${String(new Date(Date.UTC(y, m0, 1)).getUTCMonth() + 1).padStart(2, "0")}`;
const dayOf = (periodKey: string, dueDay: number) => {
  const [y, m] = periodKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, Math.min(28, Math.max(1, dueDay))));
};

export function nextCharge(now: Date, billing: { startMonth: string; dueDay: number }, payments: PaymentLite[]): NextCharge {
  const nowKey = key(now.getUTCFullYear(), now.getUTCMonth());
  const paid = (k: string) => payments.some((p) => p.periodKey === k && p.status === "pagado");
  const days = (d: Date) => Math.ceil((d.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000);

  // Antes del primer mes con cobro, el siguiente pago es ese mes.
  if (nowKey < billing.startMonth) {
    const due = dayOf(billing.startMonth, billing.dueDay);
    return { state: "sin_cobro", periodKey: billing.startMonth, dueDate: due, daysToDue: days(due) };
  }
  // El mes en curso ya está pagado: el siguiente cobro es el mes que viene.
  if (paid(nowKey)) {
    const [y, m] = nowKey.split("-").map(Number);
    const nextKey = key(y, m);
    const due = dayOf(nextKey, billing.dueDay);
    return { state: "al_corriente", periodKey: nextKey, dueDate: due, daysToDue: days(due) };
  }
  const due = dayOf(nowKey, billing.dueDay);
  const d = days(due);
  return { state: d < 0 ? "vencido" : "pendiente", periodKey: nowKey, dueDate: due, daysToDue: d };
}
