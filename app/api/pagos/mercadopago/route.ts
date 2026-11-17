import { applyPayment, fetchPayment } from "@/lib/mercadopago";
import { verifySignature } from "@/lib/mercadopago-core";

// Notificaciones (webhooks) de Mercado Pago. Nunca se confía en el contenido: se valida la firma y el pago se
// vuelve a consultar a Mercado Pago antes de registrarlo.
export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !secret) return new Response("No configurado", { status: 503 });

  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as { type?: string; action?: string; data?: { id?: string | number } } | null;
  const dataId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? "");
  const valid = verifySignature({ xSignature: request.headers.get("x-signature"), xRequestId: request.headers.get("x-request-id"), dataId, secret });
  if (!valid) return new Response("Firma no válida", { status: 401 });

  const type = body?.type ?? url.searchParams.get("type") ?? "";
  if (type !== "payment" || !dataId) return new Response("ok", { status: 200 });

  const payment = await fetchPayment(dataId);
  // Si Mercado Pago no responde, se contesta error para que reintente la notificación.
  if (!payment) return new Response("No se pudo consultar el pago", { status: 502 });
  const result = await applyPayment(payment);
  console.info("mercadopago_webhook", { id: dataId, result });
  return new Response("ok", { status: 200 });
}
