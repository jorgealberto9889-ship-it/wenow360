"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { saveBillingProfile } from "@/lib/billing";
import { requireAdmin } from "@/lib/dal";

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export type ProfileState = { ok?: boolean; error?: string } | undefined;

// Datos fiscales que el administrador del cliente captura para su factura.
export async function saveProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireAdmin();
  const rfc = clean(formData.get("rfc"), 13).toUpperCase();
  const email = clean(formData.get("email"), 120).toLowerCase();
  if (rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) return { error: "El RFC no tiene un formato válido." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "El correo de facturación no es válido." };
  await saveBillingProfile({
    legalName: clean(formData.get("legalName"), 120), rfc, email,
    taxRegime: clean(formData.get("taxRegime"), 80), zip: clean(formData.get("zip"), 5).replace(/\D/g, ""), cfdiUse: clean(formData.get("cfdiUse"), 4).toUpperCase() || "G03",
  });
  await db.insert(schema.auditLogs).values({ actorId: admin.id, actorType: "admin", action: "billing_profile_updated", entity: "billing_profile", entityId: "profile" });
  revalidatePath("/admin/pagos");
  return { ok: true };
}
