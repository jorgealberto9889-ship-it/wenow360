import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { ADMIN_COOKIE, decryptAdminSession } from "./session";

// Revalida contra la base en cada request: desactivar a un admin corta su acceso de inmediato.
export const requireAdmin = cache(async () => {
  const session = await decryptAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const [admin] = await db
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, role: schema.adminUsers.role })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.id, session.sub), eq(schema.adminUsers.active, true)));
  if (!admin) redirect("/admin/login");

  return admin;
});
