"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createAdminSession, deleteAdminSession } from "@/lib/session";

const MAX_FAILED = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
// Hash de relleno para que un correo inexistente tarde lo mismo que una contraseña incorrecta.
const DUMMY_HASH = "$2b$12$KbymZSz0MTe.JOYa9lPyaOa/zm7Uk1YAqBCkir.qO3qxcoejtjqJu";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string } | undefined;

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Escribe tu correo y tu contraseña." };
  const { email, password } = parsed.data;

  const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));

  if (admin) {
    const since = new Date(Date.now() - LOCK_WINDOW_MS).toISOString();
    const failed = await db.$count(
      schema.auditLogs,
      and(
        eq(schema.auditLogs.action, "login_failed"),
        eq(schema.auditLogs.entityId, admin.id),
        gt(schema.auditLogs.createdAt, since),
      ),
    );
    if (failed >= MAX_FAILED) {
      return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };
    }
  }

  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !admin.active || !ok) {
    if (admin) {
      await db.insert(schema.auditLogs).values({
        actorType: "system", action: "login_failed", entity: "admin_users", entityId: admin.id,
      });
    }
    return { error: "Correo o contraseña incorrectos." };
  }

  await db
    .update(schema.adminUsers)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(schema.adminUsers.id, admin.id));
  await db.insert(schema.auditLogs).values({
    actorId: admin.id, actorType: "admin", action: "login", entity: "admin_users", entityId: admin.id,
  });
  await createAdminSession({ sub: admin.id, role: admin.role });
  redirect("/admin");
}

export async function logout() {
  await deleteAdminSession();
  redirect("/admin/login");
}
