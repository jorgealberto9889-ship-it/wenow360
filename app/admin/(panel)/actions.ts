"use server";

import bcrypt from "bcryptjs";
import { and, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { isLeadStatus } from "@/lib/admin/format";
import { publicOrigin } from "@/lib/admin/origin";
import { requireAdmin } from "@/lib/dal";
import { parseStoreUrl } from "@/lib/store-url";
import { CORPORATE_SLUG } from "@/lib/submission";
import { LAUNCH_TTL, sendLaunchEmail } from "@/lib/launch-email";
import { RESET_TTL, sendPasswordEmail, signPasswordLink } from "@/lib/portal";

async function audit(actorId: string, action: string, entity: string, entityId: string) {
  await db.insert(schema.auditLogs).values({ actorId, actorType: "admin", action, entity, entityId });
}

// `emailed`: al registrar un distribuidor nuevo, si el correo de acceso a su portal salió bien (false = falló el envío).
export type FormState = { error?: string; ok?: boolean; emailed?: boolean } | undefined;

// ---------- Prospectos ----------

export async function setProspectStatus(prospectId: string, status: string) {
  const admin = await requireAdmin();
  if (!isLeadStatus(status)) return;
  await db.insert(schema.leadStatusHistory).values({ prospectId, status });
  await audit(admin.id, `prospect_status:${status}`, "prospects", prospectId);
  revalidatePath("/admin", "layout");
}

// ---------- Distribuidores ----------

export async function toggleDistributor(id: number, active: boolean) {
  const admin = await requireAdmin();
  const [d] = await db.select({ slug: schema.distributors.slug }).from(schema.distributors).where(eq(schema.distributors.id, id));
  // El corporativo recibe los enlaces con slug inválido: no se puede desactivar.
  if (!d || d.slug === "wenow") return;
  await db
    .update(schema.distributors)
    .set({ active, updatedAt: new Date().toISOString(), deactivatedReason: active ? null : "Desactivado desde el panel" })
    .where(eq(schema.distributors.id, id));
  await audit(admin.id, active ? "distributor_activated" : "distributor_deactivated", "distributors", String(id));
  revalidatePath("/admin", "layout");
}

const phone = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .transform((s) => (s.length === 10 ? `52${s}` : s))
  .pipe(z.string().regex(/^\d{11,15}$/, "El WhatsApp debe tener 10 dígitos (o incluir lada internacional)."));

const distributorSchema = z.object({
  displayName: z.string().trim().min(3, "Escribe el nombre del distribuidor.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "El enlace solo puede llevar minúsculas, números y guiones.")
    .max(60),
  email: z.string().trim().toLowerCase().email("Revisa el correo.").or(z.literal("")).transform((s) => s || null),
  whatsapp: phone,
  distributorId: z.string().trim().max(40).transform((s) => s || null),
  storeUrl: z.string().trim().max(500),
});

export async function saveDistributor(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = distributorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const id = Number(formData.get("id")) || null;
  const now = new Date().toISOString();
  // El correo es obligatorio al registrar: ahí le llega el acceso a su portal.
  if (!id && !parsed.data.email) return { error: "El correo es obligatorio: ahí recibirá el acceso a su portal." };
  // Enlace de referido de la tienda: obligatorio al registrar; al editar, vacío = conservar el actual.
  const { storeUrl: rawStore, ...fields } = parsed.data;
  let storeUrl: string | undefined;
  if (rawStore || !id) {
    const r = parseStoreUrl(rawStore);
    if (!r.ok) return { error: r.error };
    storeUrl = r.url;
  }

  const [taken] = await db.select({ id: schema.distributors.id }).from(schema.distributors).where(eq(schema.distributors.slug, parsed.data.slug));
  if (taken && taken.id !== id) return { error: "Ese enlace ya lo usa otro distribuidor." };

  let created: { id: number; email: string; name: string; slug: string } | null = null;
  try {
    if (id) {
      await db.update(schema.distributors).set({ ...fields, ...(storeUrl ? { storeUrl } : {}), updatedAt: now }).where(eq(schema.distributors.id, id));
      await audit(admin.id, "distributor_updated", "distributors", String(id));
    } else {
      const [row] = await db
        .insert(schema.distributors)
        // store_url es obligatoria en la tabla heredada; la tienda del backoffice ya no se usa.
        .values({ ...fields, storeUrl: storeUrl!, active: true, createdAt: now, updatedAt: now })
        .returning({ id: schema.distributors.id });
      await audit(admin.id, "distributor_created", "distributors", String(row!.id));
      created = { id: row!.id, email: parsed.data.email!, name: parsed.data.displayName, slug: parsed.data.slug };
    }
  } catch {
    return { error: "No se pudo guardar. Revisa que el ID de distribuidor no esté repetido." };
  }
  revalidatePath("/admin", "layout");
  if (!created) return { ok: true };

  // Distribuidor nuevo: el correo con el acceso a su portal sale siempre, en automático.
  const origin = await publicOrigin();
  const r = await sendLaunchEmail(created.email, {
    name: created.name, origin, distributorLink: `${origin}/d/${created.slug}`,
    activateUrl: `${origin}/portal/restablecer/${await signPasswordLink(created.id, null, LAUNCH_TTL)}`,
  });
  if (r.ok) await audit(admin.id, "portal_invited", "distributors", String(created.id));
  return { ok: true, emailed: r.ok };
}

// ---------- Catálogo ----------

export async function toggleProduct(id: string, active: boolean) {
  const admin = await requireAdmin();
  await db.update(schema.products).set({ active }).where(eq(schema.products.id, id));
  await audit(admin.id, active ? "product_activated" : "product_deactivated", "products", id);
  revalidatePath("/admin", "layout");
}

const priceSchema = z
  .object({
    id: z.string().min(1),
    publicPrice: z.coerce.number().int("Usa pesos enteros.").positive("El precio debe ser mayor a cero."),
    distributorPrice: z.coerce.number().int("Usa pesos enteros.").positive("El precio debe ser mayor a cero."),
  })
  .refine((p) => p.distributorPrice < p.publicPrice, "El precio miembro debe ser menor al público.");

export async function saveProductPrices(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = priceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los precios." };
  const { id, ...prices } = parsed.data;
  await db.update(schema.products).set(prices).where(eq(schema.products.id, id));
  await audit(admin.id, "product_prices_updated", "products", id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Acceso al portal del distribuidor ----------

export type AccessState = { error?: string; sent?: number; password?: string } | undefined;

export async function inviteDistributor(id: number): Promise<AccessState> {
  const admin = await requireAdmin();
  const [d] = await db.select().from(schema.distributors).where(eq(schema.distributors.id, id));
  if (!d?.email) return { error: "Este distribuidor no tiene correo registrado." };
  if (!d.active) return { error: "Activa al distribuidor antes de invitarlo." };
  const origin = await publicOrigin();
  // Sin acceso: correo de lanzamiento con el botón para activar su panel. Con acceso: enlace para cambiar contraseña.
  const r = d.portalPasswordHash
    ? await sendPasswordEmail({ to: d.email, name: d.displayName, url: `${origin}/portal/restablecer/${await signPasswordLink(d.id, d.portalPasswordHash, RESET_TTL)}`, kind: "recuperacion" })
    : await sendLaunchEmail(d.email, {
        name: d.displayName, origin, distributorLink: `${origin}/d/${d.slug}`,
        activateUrl: `${origin}/portal/restablecer/${await signPasswordLink(d.id, null, LAUNCH_TTL)}`,
      });
  if (!r.ok) return { error: "No se pudo enviar el correo. Revisa Operación." };
  await audit(admin.id, "portal_invited", "distributors", String(id));
  return { sent: 1 };
}

// Invita a todos los activos con correo que aún no tienen contraseña (excepto la cuenta corporativa).
export async function inviteAllDistributors(): Promise<AccessState> {
  const admin = await requireAdmin();
  const pending = await db
    .select()
    .from(schema.distributors)
    .where(and(eq(schema.distributors.active, true), isNull(schema.distributors.portalPasswordHash), isNotNull(schema.distributors.email), ne(schema.distributors.slug, CORPORATE_SLUG)));
  const origin = await publicOrigin();
  let sent = 0;
  for (const d of pending) {
    if (!d.email) continue;
    const r = await sendLaunchEmail(d.email, {
      name: d.displayName, origin, distributorLink: `${origin}/d/${d.slug}`,
      activateUrl: `${origin}/portal/restablecer/${await signPasswordLink(d.id, null, LAUNCH_TTL)}`,
    });
    if (r.ok) {
      sent++;
      await audit(admin.id, "portal_invited", "distributors", String(d.id));
    }
    // Resend acepta pocos envíos por segundo.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return { sent };
}

// Contraseña temporal para compartir por WhatsApp; el distribuidor puede cambiarla en «Mi cuenta».
export async function temporaryPassword(id: number): Promise<AccessState> {
  const admin = await requireAdmin();
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("").replace(/(.{5})/, "$1-");
  await db
    .update(schema.distributors)
    .set({ portalPasswordHash: await bcrypt.hash(password, 12), updatedAt: new Date().toISOString() })
    .where(eq(schema.distributors.id, id));
  await audit(admin.id, "portal_temp_password", "distributors", String(id));
  revalidatePath("/admin", "layout");
  return { password };
}

export async function revokePortalAccess(id: number): Promise<AccessState> {
  const admin = await requireAdmin();
  await db.update(schema.distributors).set({ portalPasswordHash: null, updatedAt: new Date().toISOString() }).where(eq(schema.distributors.id, id));
  await audit(admin.id, "portal_revoked", "distributors", String(id));
  revalidatePath("/admin", "layout");
  return {};
}

// ---------- Solicitudes del enlace de registro ----------

export type ReviewState = { error?: string; done?: "aprobada" | "rechazada"; emailed?: boolean } | undefined;

// Aprueba: crea al distribuidor (activo) con el enlace libre más parecido a su nombre y le envía el correo para
// activar su portal, que incluye su enlace de WeNow 360.
export async function approveApplication(id: string): Promise<ReviewState> {
  const admin = await requireAdmin();
  const [app] = await db.select().from(schema.distributorApplications).where(eq(schema.distributorApplications.id, id));
  if (!app || app.status !== "pendiente") return { error: "Esta solicitud ya fue revisada." };
  const [dup] = await db
    .select({ id: schema.distributors.id })
    .from(schema.distributors)
    .where(or(eq(schema.distributors.email, app.email), eq(schema.distributors.distributorId, app.distributorNumber)));
  if (dup) return { error: "Ya existe un distribuidor con ese correo o número de distribuidor." };

  let slug = app.slug;
  for (let n = 2; ; n++) {
    const [taken] = await db.select({ id: schema.distributors.id }).from(schema.distributors).where(eq(schema.distributors.slug, slug));
    if (!taken) break;
    slug = `${app.slug}-${n}`;
  }
  const now = new Date().toISOString();
  const [d] = await db
    .insert(schema.distributors)
    .values({
      displayName: app.displayName, slug, email: app.email, whatsapp: app.whatsapp, distributorId: app.distributorNumber,
      storeUrl: app.storeUrl, active: true, createdAt: now, updatedAt: now,
    })
    .returning({ id: schema.distributors.id });
  await db
    .update(schema.distributorApplications)
    .set({ status: "aprobada", reviewedAt: now, reviewedBy: admin.id, distributorRef: d!.id })
    .where(eq(schema.distributorApplications.id, id));
  await audit(admin.id, "application_approved", "distributors", String(d!.id));

  const origin = await publicOrigin();
  const r = await sendLaunchEmail(app.email, {
    name: app.displayName, origin, distributorLink: `${origin}/d/${slug}`,
    activateUrl: `${origin}/portal/restablecer/${await signPasswordLink(d!.id, null, LAUNCH_TTL)}`,
  });
  if (r.ok) await audit(admin.id, "portal_invited", "distributors", String(d!.id));
  revalidatePath("/admin", "layout");
  return { done: "aprobada", emailed: r.ok };
}

export async function rejectApplication(id: string): Promise<ReviewState> {
  const admin = await requireAdmin();
  await db
    .update(schema.distributorApplications)
    .set({ status: "rechazada", reviewedAt: new Date().toISOString(), reviewedBy: admin.id })
    .where(and(eq(schema.distributorApplications.id, id), eq(schema.distributorApplications.status, "pendiente")));
  await audit(admin.id, "application_rejected", "distributor_applications", id);
  revalidatePath("/admin", "layout");
  return { done: "rechazada" };
}
