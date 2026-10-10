"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireOwner } from "@/lib/dal";
import { loadSettings, saveSettings } from "@/lib/usage";
import { netFee, type FixedCost, type OwnerSettings } from "@/lib/usage-costs";

const num = (v: FormDataEntryValue | null, fallback: number) => {
  const n = Number(String(v ?? "").replace(/,/g, "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export async function saveOwnerSettings(formData: FormData) {
  const owner = await requireOwner();
  const cur = await loadSettings();
  const fixed: FixedCost[] = [];
  for (let i = 0; i < 8; i++) {
    const name = String(formData.get(`fixed_name_${i}`) ?? "").trim().slice(0, 60);
    if (!name) continue;
    const currency = String(formData.get(`fixed_cur_${i}`));
    fixed.push({ name, amount: num(formData.get(`fixed_amount_${i}`), 0), currency: currency === "EUR" || currency === "MXN" ? currency : "USD" });
  }
  const plan = {
    priceWithIva: num(formData.get("planPrice"), cur.plan.priceWithIva),
    ivaPct: num(formData.get("planIva"), cur.plan.ivaPct),
    scans: Math.round(num(formData.get("planScans"), cur.plan.scans)),
    emails: Math.round(num(formData.get("planEmails"), cur.plan.emails)),
    winnieReference: Math.round(num(formData.get("planWinnie"), cur.plan.winnieReference)),
  };
  const link = String(formData.get("paymentLink") ?? "").trim().slice(0, 500);
  const next: OwnerSettings = {
    billing: {
      startMonth: /^\d{4}-(0[1-9]|1[0-2])$/.test(String(formData.get("billingStart"))) ? String(formData.get("billingStart")) : cur.billing.startMonth,
      dueDay: Math.min(28, Math.max(1, Math.round(num(formData.get("dueDay"), cur.billing.dueDay)))),
      reminderDays: Math.min(15, Math.max(0, Math.round(num(formData.get("reminderDays"), cur.billing.reminderDays)))),
      // Solo enlaces https (el cliente los abre desde su panel).
      paymentLink: /^https:\/\//.test(link) ? link : "",
    },
    aiBudgetPct: Math.min(100, num(formData.get("aiBudgetPct"), cur.aiBudgetPct)),
    plan,
    feeMxn: netFee(plan),
    usdMxn: num(formData.get("usdMxn"), cur.usdMxn),
    eurMxn: num(formData.get("eurMxn"), cur.eurMxn),
    fixed,
    shen: { included: num(formData.get("shenIncluded"), cur.shen.included), extraEur: num(formData.get("shenExtraEur"), cur.shen.extraEur), paidByClient: formData.get("shenPaidByClient") === "on" },
    gemini: { inputUsdPerM: num(formData.get("geminiIn"), cur.gemini.inputUsdPerM), outputUsdPerM: num(formData.get("geminiOut"), cur.gemini.outputUsdPerM) },
    tts: { usdPerMChars: num(formData.get("ttsRate"), cur.tts.usdPerMChars), freeChars: num(formData.get("ttsFree"), cur.tts.freeChars) },
    email: { freePerMonth: num(formData.get("emailFree"), cur.email.freePerMonth), usdPerEmail: num(formData.get("emailRate"), cur.email.usdPerEmail) },
    annual: {
      name: cur.annual.name,
      amountMxn: num(formData.get("annualAmount"), cur.annual.amountMxn),
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("annualStart"))) ? String(formData.get("annualStart")) : cur.annual.startDate,
      freeYears: Math.round(num(formData.get("annualFree"), cur.annual.freeYears)),
      passThrough: formData.get("annualPassThrough") === "on",
    },
  };
  await saveSettings(next);
  await db.insert(schema.auditLogs).values({ actorId: owner.id, actorType: "admin", action: "owner_settings_updated", entity: "owner_settings", entityId: "settings" });
  revalidatePath("/admin/dueno");
}

// ---------- Pagos del cliente ----------

const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function recordPayment(formData: FormData) {
  const owner = await requireOwner();
  const concept = text(formData.get("concept"), 120);
  const periodKey = text(formData.get("periodKey"), 12);
  const amount = num(formData.get("amount"), -1);
  const status = String(formData.get("status"));
  if (!concept || !/^(\d{4}-(0[1-9]|1[0-2])|\d{4}-anual)$/.test(periodKey) || amount < 0) return;
  const paidAt = /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("paidAt"))) ? new Date(`${formData.get("paidAt")}T12:00:00Z`).toISOString() : null;
  const invoice = text(formData.get("invoiceUrl"), 500);
  await db.insert(schema.payments).values({
    concept, periodKey, amountMxn: amount,
    status: status === "pendiente" || status === "vencido" ? status : "pagado",
    paidAt, method: text(formData.get("method"), 40), reference: text(formData.get("reference"), 80),
    invoiceUrl: /^https:\/\//.test(invoice) ? invoice : "",
  });
  await db.insert(schema.auditLogs).values({ actorId: owner.id, actorType: "admin", action: "payment_recorded", entity: "payments", entityId: periodKey });
  revalidatePath("/admin/dueno");
  revalidatePath("/admin/pagos");
}

export async function deletePayment(id: string) {
  const owner = await requireOwner();
  await db.delete(schema.payments).where(eq(schema.payments.id, id));
  await db.insert(schema.auditLogs).values({ actorId: owner.id, actorType: "admin", action: "payment_deleted", entity: "payments", entityId: id });
  revalidatePath("/admin/dueno");
  revalidatePath("/admin/pagos");
}
