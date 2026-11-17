"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { publicOrigin } from "@/lib/admin/origin";
import { listPayments } from "@/lib/billing";
import { nextCharge } from "@/lib/billing-status";
import { createPreference, mercadopagoEnabled } from "@/lib/mercadopago";
import { loadSettings } from "@/lib/usage";

// Crea el enlace de pago del mes que toca y lleva al admin a Mercado Pago.
export async function startPayment() {
  await requireAdmin();
  if (!mercadopagoEnabled()) redirect("/admin/pagos?pago=sin_configurar");
  const [settings, history] = await Promise.all([loadSettings(), listPayments()]);
  const charge = nextCharge(new Date(), settings.billing, history);
  const result = await createPreference(charge.periodKey, await publicOrigin());
  if (!result.ok) {
    console.error("mercadopago_preferencia", result.error);
    redirect("/admin/pagos?pago=error_enlace");
  }
  redirect(result.url);
}
