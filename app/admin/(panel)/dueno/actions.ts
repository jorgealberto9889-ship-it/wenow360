"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireOwner } from "@/lib/dal";
import { loadSettings, saveSettings } from "@/lib/usage";
import type { FixedCost, OwnerSettings } from "@/lib/usage-costs";

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
  const next: OwnerSettings = {
    feeMxn: num(formData.get("feeMxn"), cur.feeMxn),
    usdMxn: num(formData.get("usdMxn"), cur.usdMxn),
    eurMxn: num(formData.get("eurMxn"), cur.eurMxn),
    fixed,
    shen: { included: num(formData.get("shenIncluded"), cur.shen.included), extraEur: num(formData.get("shenExtraEur"), cur.shen.extraEur) },
    gemini: { inputUsdPerM: num(formData.get("geminiIn"), cur.gemini.inputUsdPerM), outputUsdPerM: num(formData.get("geminiOut"), cur.gemini.outputUsdPerM) },
    tts: { usdPerMChars: num(formData.get("ttsRate"), cur.tts.usdPerMChars), freeChars: num(formData.get("ttsFree"), cur.tts.freeChars) },
    email: { freePerMonth: num(formData.get("emailFree"), cur.email.freePerMonth), usdPerEmail: num(formData.get("emailRate"), cur.email.usdPerEmail) },
    annual: {
      name: cur.annual.name,
      amountMxn: num(formData.get("annualAmount"), cur.annual.amountMxn),
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("annualStart"))) ? String(formData.get("annualStart")) : cur.annual.startDate,
      freeYears: Math.round(num(formData.get("annualFree"), cur.annual.freeYears)),
    },
  };
  await saveSettings(next);
  await db.insert(schema.auditLogs).values({ actorId: owner.id, actorType: "admin", action: "owner_settings_updated", entity: "owner_settings", entityId: "settings" });
  revalidatePath("/admin/dueno");
}
