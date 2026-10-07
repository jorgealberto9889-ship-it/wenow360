"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { isLeadStatus } from "@/lib/admin/format";
import { publicOrigin } from "@/lib/admin/origin";
import {
  createPortalSession, deletePortalSession, requireDistributor, RESET_TTL, sendPasswordEmail, signPasswordLink, verifyPasswordLink,
} from "@/lib/portal";

export type PortalState = { error?: string; ok?: boolean } | undefined;

const MAX_FAILED = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const DUMMY_HASH = "$2b$12$KbymZSz0MTe.JOYa9lPyaOa/zm7Uk1YAqBCkir.qO3qxcoejtjqJu";

const email = z.string().trim().toLowerCase().email();
const byEmail = (e: string) =>
  db
    .select({ id: schema.distributors.id, displayName: schema.distributors.displayName, email: schema.distributors.email, hash: schema.distributors.portalPasswordHash })
    .from(schema.distributors)
    .where(and(sql`lower(${schema.distributors.email}) = ${e}`, eq(schema.distributors.active, true)));

const log = (action: string, entityId: string, actorId: string | null = null, actorType: "distributor" | "system" = "system") =>
  db.insert(schema.auditLogs).values({ actorId, actorType, action, entity: "distributors", entityId });

// ---------- Entrar ----------

export async function portalLogin(_: PortalState, formData: FormData): Promise<PortalState> {
  const parsed = z.object({ email, password: z.string().min(1).max(200) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Escribe tu correo y tu contraseña." };
  const { email: e, password } = parsed.data;

  const failed = await db.$count(
    schema.auditLogs,
    and(eq(schema.auditLogs.action, "portal_login_failed"), eq(schema.auditLogs.entityId, e), gt(schema.auditLogs.createdAt, new Date(Date.now() - LOCK_WINDOW_MS).toISOString())),
  );
  if (failed >= MAX_FAILED) return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };

  // Un mismo correo puede pertenecer a más de una cuenta: entra la que coincida con la contraseña.
  const candidates = (await byEmail(e)).filter((d) => d.hash);
  let match: (typeof candidates)[number] | undefined;
  for (const d of candidates) if (await bcrypt.compare(password, d.hash!)) match = match ?? d;
  if (candidates.length === 0) await bcrypt.compare(password, DUMMY_HASH);
  if (!match) {
    await log("portal_login_failed", e);
    return { error: "Correo o contraseña incorrectos." };
  }
  await log("portal_login", String(match.id), String(match.id), "distributor");
  await createPortalSession(match.id);
  redirect("/portal");
}

export async function portalLogout() {
  await deletePortalSession();
  redirect("/portal/entrar");
}

// ---------- Olvidé mi contraseña ----------

export async function requestPasswordReset(_: PortalState, formData: FormData): Promise<PortalState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Escribe un correo válido." };
  const origin = await publicOrigin();
  for (const d of await byEmail(parsed.data)) {
    const token = await signPasswordLink(d.id, d.hash, RESET_TTL);
    await sendPasswordEmail({ to: d.email!, name: d.displayName, url: `${origin}/portal/restablecer/${token}`, kind: "recuperacion" });
    await log("portal_reset_requested", String(d.id));
  }
  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
  return { ok: true };
}

// ---------- Crear o restablecer contraseña (desde el enlace) ----------

const newPassword = z
  .object({ password: z.string().min(8, "Usa al menos 8 caracteres.").max(200), confirm: z.string() })
  .refine((v) => v.password === v.confirm, "Las contraseñas no coinciden.");

export async function setPasswordFromLink(token: string, _: PortalState, formData: FormData): Promise<PortalState> {
  const parsed = newPassword.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const link = await verifyPasswordLink(token);
  if (!link) return { error: "Este enlace ya no es válido. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
  const hash = await bcrypt.hash(parsed.data.password, 12);
  await db.update(schema.distributors).set({ portalPasswordHash: hash, updatedAt: new Date().toISOString() }).where(eq(schema.distributors.id, link.id));
  await log(link.isNew ? "portal_password_created" : "portal_password_reset", String(link.id), String(link.id), "distributor");
  await createPortalSession(link.id);
  redirect("/portal");
}

// ---------- Dentro del portal ----------

export async function changePassword(_: PortalState, formData: FormData): Promise<PortalState> {
  const me = await requireDistributor();
  const parsed = newPassword.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const [d] = await db.select({ hash: schema.distributors.portalPasswordHash }).from(schema.distributors).where(eq(schema.distributors.id, me.id));
  if (!d?.hash || !(await bcrypt.compare(String(formData.get("current") ?? ""), d.hash))) return { error: "Tu contraseña actual no es correcta." };
  await db
    .update(schema.distributors)
    .set({ portalPasswordHash: await bcrypt.hash(parsed.data.password, 12), updatedAt: new Date().toISOString() })
    .where(eq(schema.distributors.id, me.id));
  await log("portal_password_changed", String(me.id), String(me.id), "distributor");
  return { ok: true };
}

// Solo sobre prospectos de su propio enlace.
async function ownProspect(prospectId: string) {
  const me = await requireDistributor();
  const [p] = await db
    .select({ id: schema.prospects.id })
    .from(schema.prospects)
    .where(and(eq(schema.prospects.id, prospectId), eq(schema.prospects.distributorSlug, me.slug)));
  return p ? me : null;
}

export async function setLeadStatus(prospectId: string, status: string) {
  const me = await ownProspect(prospectId);
  if (!me || !isLeadStatus(status)) return;
  await db.insert(schema.leadStatusHistory).values({ prospectId, status, changedBy: me.id });
  revalidatePath("/portal", "layout");
  revalidatePath("/admin", "layout");
}

export async function addNote(prospectId: string, _: PortalState, formData: FormData): Promise<PortalState> {
  const me = await ownProspect(prospectId);
  if (!me) return { error: "No encontramos a este prospecto." };
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!note) return { error: "Escribe tu nota." };
  await db.insert(schema.commercialNotes).values({ prospectId, distributorId: me.id, note });
  revalidatePath(`/portal/prospecto/${prospectId}`);
  return { ok: true };
}
