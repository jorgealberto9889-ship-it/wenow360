import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

// Datos fiscales del cliente para emitir la factura (CFDI). Los captura el administrador del cliente.
export type BillingProfile = { legalName: string; rfc: string; email: string; taxRegime: string; zip: string; cfdiUse: string };
export const EMPTY_PROFILE: BillingProfile = { legalName: "", rfc: "", email: "", taxRegime: "", zip: "", cfdiUse: "G03" };
const PROFILE_KEY = "billing_profile";

export async function loadBillingProfile(): Promise<BillingProfile> {
  const [row] = await db.select({ value: schema.ownerSettings.value }).from(schema.ownerSettings).where(eq(schema.ownerSettings.key, PROFILE_KEY));
  if (!row) return EMPTY_PROFILE;
  try {
    return { ...EMPTY_PROFILE, ...(JSON.parse(row.value) as Partial<BillingProfile>) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveBillingProfile(profile: BillingProfile) {
  const value = JSON.stringify(profile);
  await db
    .insert(schema.ownerSettings)
    .values({ key: PROFILE_KEY, value })
    .onConflictDoUpdate({ target: schema.ownerSettings.key, set: { value, updatedAt: new Date().toISOString() } });
}

export const listPayments = () => db.select().from(schema.payments).orderBy(desc(schema.payments.periodKey), desc(schema.payments.createdAt));
