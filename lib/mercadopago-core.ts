// Lógica pura del cobro con Mercado Pago (sin red ni base de datos) para poder probarla.
import { createHmac, timingSafeEqual } from "node:crypto";

// Cada cobro mensual lleva la referencia «wenow-AAAA-MM»; así el pago se asocia solo al mes que corresponde.
export const externalReference = (periodKey: string) => `wenow-${periodKey}`;

export function parseExternalReference(ref: unknown): string | null {
  const m = /^wenow-(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(String(ref ?? ""));
  return m ? m[1] : null;
}

// Firma de las notificaciones (webhooks) de Mercado Pago: x-signature = "ts=…,v1=…". El v1 es un HMAC-SHA256 de
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con la clave secreta del webhook.
export function verifySignature(o: { xSignature: string | null; xRequestId: string | null; dataId: string | null; secret: string }) {
  if (!o.xSignature || !o.secret || !o.dataId) return false;
  const parts = Object.fromEntries(o.xSignature.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(o.dataId) ? o.dataId.toLowerCase() : o.dataId;
  const manifest = `id:${id};${o.xRequestId ? `request-id:${o.xRequestId};` : ""}ts:${ts};`;
  const expected = createHmac("sha256", o.secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type MpPayment = {
  id: number | string;
  status: string; // approved, pending, rejected, refunded, charged_back, …
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string | null;
  payment_method_id?: string;
};

export type PaymentDecision =
  | { action: "registrar"; periodKey: string; amountMxn: number; paidAt: string; reference: string; method: string }
  | { action: "revertir"; reference: string }
  | { action: "ignorar"; reason: string };

// Decide qué hacer con un pago consultado a Mercado Pago. Solo se registra un pago aprobado, en pesos, del mes que
// indica la referencia y por al menos el monto del plan.
export function decidePayment(p: MpPayment, expectedMxn: number): PaymentDecision {
  const reference = `mp:${p.id}`;
  if (p.status === "refunded" || p.status === "charged_back") return { action: "revertir", reference };
  if (p.status !== "approved") return { action: "ignorar", reason: `estado ${p.status}` };
  const periodKey = parseExternalReference(p.external_reference);
  if (!periodKey) return { action: "ignorar", reason: "referencia desconocida" };
  if ((p.currency_id ?? "MXN") !== "MXN") return { action: "ignorar", reason: "moneda distinta de MXN" };
  const amount = Number(p.transaction_amount ?? 0);
  if (!(amount > 0) || amount + 0.01 < expectedMxn) return { action: "ignorar", reason: "monto menor al plan" };
  return { action: "registrar", periodKey, amountMxn: amount, paidAt: p.date_approved ?? new Date().toISOString(), reference, method: "Mercado Pago" };
}
