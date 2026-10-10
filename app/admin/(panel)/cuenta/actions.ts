"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/dal";

export type PasswordState = { ok?: boolean; error?: string } | undefined;

// Cambio de contraseña del administrador: pide la actual y exige mínimo 12 caracteres.
export async function changePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 12) return { error: "La nueva contraseña debe tener al menos 12 caracteres." };
  if (next !== confirm) return { error: "La confirmación no coincide con la nueva contraseña." };
  if (next === current) return { error: "La nueva contraseña debe ser distinta a la actual." };

  const [row] = await db.select({ hash: schema.adminUsers.passwordHash }).from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id));
  if (!row || !(await bcrypt.compare(current, row.hash))) return { error: "La contraseña actual no es correcta." };

  await db.update(schema.adminUsers).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(schema.adminUsers.id, admin.id));
  await db.insert(schema.auditLogs).values({ actorId: admin.id, actorType: "admin", action: "admin_password_changed", entity: "admin_users", entityId: admin.id });
  return { ok: true };
}
