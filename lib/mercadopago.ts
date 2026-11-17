import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decidePayment, externalReference, type MpPayment } from "./mercadopago-core";
import { loadSettings } from "./usage";

const API = "https://api.mercadopago.com";

// El cobro con Mercado Pago se activa cuando existe el token de acceso (Vercel → MERCADOPAGO_ACCESS_TOKEN).
export const mercadopagoEnabled = () => Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

const headers = () => ({ authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, "content-type": "application/json" });

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const periodName = (k: string) => `${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`;

// Crea el enlace de pago (Checkout Pro) del mes indicado. El monto sale del plan configurado en el panel del dueño.
export async function createPreference(periodKey: string, origin: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { plan } = await loadSettings();
  if (!(plan.priceWithIva > 0)) return { ok: false, error: "El plan no tiene un monto configurado." };
  try {
    const res = await fetch(`${API}/checkout/preferences`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        items: [{ id: `plan-${periodKey}`, title: `WeNow 360 · plan de ${periodName(periodKey)}`, quantity: 1, unit_price: plan.priceWithIva, currency_id: "MXN" }],
        external_reference: externalReference(periodKey),
        notification_url: `${origin}/api/pagos/mercadopago`,
        back_urls: { success: `${origin}/admin/pagos?pago=ok`, pending: `${origin}/admin/pagos?pago=pendiente`, failure: `${origin}/admin/pagos?pago=error` },
        auto_return: "approved",
        statement_descriptor: "WENOW 360",
      }),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { init_point?: string; message?: string } | null;
    if (!res.ok || !body?.init_point) return { ok: false, error: `Mercado Pago respondió ${res.status}${body?.message ? `: ${body.message}` : ""}` };
    return { ok: true, url: body.init_point };
  } catch (e) {
    return { ok: false, error: `Sin conexión con Mercado Pago: ${e instanceof Error ? e.message : "error desconocido"}` };
  }
}

export async function fetchPayment(id: string): Promise<MpPayment | null> {
  try {
    const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: headers(), cache: "no-store" });
    return res.ok ? ((await res.json()) as MpPayment) : null;
  } catch {
    return null;
  }
}

// Registra (o revierte) el pago en el historial. Es idempotente: el mismo pago de Mercado Pago no se registra dos veces.
export async function applyPayment(p: MpPayment): Promise<string> {
  const { plan } = await loadSettings();
  const d = decidePayment(p, plan.priceWithIva);
  if (d.action === "ignorar") return d.reason;
  const existing = await db.select({ id: schema.payments.id }).from(schema.payments).where(and(eq(schema.payments.reference, d.reference), eq(schema.payments.method, "Mercado Pago")));
  if (d.action === "revertir") {
    if (!existing.length) return "sin pago que revertir";
    await db.update(schema.payments).set({ status: "pendiente", paidAt: null }).where(eq(schema.payments.id, existing[0].id));
    await db.insert(schema.auditLogs).values({ actorType: "system", action: "payment_reverted", entity: "payments", entityId: d.reference });
    return "revertido";
  }
  if (existing.length) return "ya registrado";
  await db.insert(schema.payments).values({
    concept: `Plan WeNow 360 · ${periodName(d.periodKey)}`, periodKey: d.periodKey, amountMxn: d.amountMxn, status: "pagado",
    paidAt: new Date(d.paidAt).toISOString(), method: d.method, reference: d.reference,
  });
  await db.insert(schema.auditLogs).values({ actorType: "system", action: "payment_recorded_auto", entity: "payments", entityId: d.periodKey });
  return "registrado";
}
