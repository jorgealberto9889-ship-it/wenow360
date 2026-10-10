import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { card, esc, layout, sendViaResend } from "./email";

export const PORTAL_COOKIE = "wenow_portal";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const RESET_TTL = "30m";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET falta o es demasiado corta");
  return new TextEncoder().encode(secret);
}

// ---------- Sesión ----------

export async function createPortalSession(distributorId: number) {
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(distributorId))
    .setAudience("portal")
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key());
  (await cookies()).set(PORTAL_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
}

export async function deletePortalSession() {
  (await cookies()).delete(PORTAL_COOKIE);
}

// Revalida contra la base en cada request: desactivar al distribuidor o quitarle la contraseña corta su acceso.
export const requireDistributor = cache(async () => {
  const token = (await cookies()).get(PORTAL_COOKIE)?.value;
  let id: number | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "portal" });
      id = Number(payload.sub) || null;
    } catch {}
  }
  if (!id) redirect("/portal/entrar");
  const [d] = await db
    .select({
      id: schema.distributors.id, slug: schema.distributors.slug, displayName: schema.distributors.displayName,
      email: schema.distributors.email, whatsapp: schema.distributors.whatsapp, storeUrl: schema.distributors.storeUrl, hasPassword: schema.distributors.portalPasswordHash,
    })
    .from(schema.distributors)
    .where(and(eq(schema.distributors.id, id), eq(schema.distributors.active, true)));
  if (!d || !d.hasPassword) redirect("/portal/entrar");
  return { ...d, hasPassword: true };
});

// ---------- Enlaces para crear o restablecer contraseña ----------
// Llevan una huella de la contraseña actual: en cuanto se usa (o cambia la contraseña), el enlace deja de servir.

const fingerprint = (hash: string | null) => (hash ?? "none").slice(-16);

export async function signPasswordLink(distributorId: number, currentHash: string | null, ttl: string) {
  return new SignJWT({ fp: fingerprint(currentHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(distributorId))
    .setAudience("portal-password")
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key());
}

export async function verifyPasswordLink(token: string) {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "portal-password" });
    const id = Number(payload.sub);
    const [d] = await db
      .select({ id: schema.distributors.id, displayName: schema.distributors.displayName, hash: schema.distributors.portalPasswordHash, active: schema.distributors.active })
      .from(schema.distributors)
      .where(eq(schema.distributors.id, id));
    if (!d || !d.active || payload.fp !== fingerprint(d.hash)) return null;
    return { id: d.id, displayName: d.displayName, isNew: !d.hash };
  } catch {
    return null;
  }
}

export async function sendPasswordEmail(opts: { to: string; name: string; url: string; kind: "invitacion" | "recuperacion" }) {
  const first = opts.name.replace(/^(q\.?\s?b\.?|dr\.?|dra\.?|lic\.?|ing\.?)\s+/i, "").split(/\s+/)[0];
  const invite = opts.kind === "invitacion";
  const title = invite ? "Tu portal de WeNow 360 ya está listo" : "Restablece tu contraseña";
  const body = invite
    ? "Desde tu portal ves a las personas que hacen su WeNow 360 con tu enlace, su resumen y los productos que se les sugirieron, y llevas el seguimiento de cada una."
    : "Recibimos una solicitud para restablecer la contraseña de tu portal de WeNow 360. Si no fuiste tú, ignora este correo.";
  const button = invite ? "Crear mi contraseña" : "Elegir nueva contraseña";
  const validity = invite ? "El enlace es válido por 72 horas." : "El enlace es válido por 30 minutos.";
  const html = layout(
    card(`<div style="font-size:20px;font-weight:800;color:#383838;margin:0 0 10px">${esc(title)}</div>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a4547">Hola ${esc(first ?? "")}, ${esc(body)}</p>
<a href="${esc(opts.url)}" style="display:inline-block;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:999px">${esc(button)}</a>
<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a8587">${esc(validity)}</p>`),
    title,
  );
  return sendViaResend({
    to: opts.to,
    subject: invite ? "Tu acceso al portal de WeNow 360" : "Restablece tu contraseña de WeNow 360",
    html,
    text: `${title}\n\nHola ${first}, ${body}\n\n${button}: ${opts.url}\n\n${validity}`,
    idempotencyKey: `portal-${opts.kind}-${opts.url.slice(-24)}`,
    tag: `portal_${opts.kind}`,
  });
}
