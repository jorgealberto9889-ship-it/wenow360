import "server-only";
import { and, eq, or } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { db, schema } from "@/db";
import { esc, sendViaResend } from "./email";
import { CORPORATE_SLUG } from "./submission";
import { parseStoreUrl } from "./store-url";

// Enlace de registro para distribuidores: /registro/<código>. El código va firmado para que solo llegue quien
// recibió el enlace de WeNow; aun así, cada solicitud se aprueba a mano en el panel.
const AUDIENCE = "registro-distribuidor";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function registrationCode() {
  // Sin fecha: la firma sale igual cada vez, así el enlace que se comparte no cambia.
  return new SignJWT({ v: 1 }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENCE).sign(key());
}

export async function isValidRegistrationCode(code: string) {
  try {
    await jwtVerify(code, key(), { algorithms: ["HS256"], audience: AUDIENCE });
    return true;
  } catch {
    return false;
  }
}

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export const applicationSchema = z.object({
  displayName: z.string().trim().min(3, "Escribe tu nombre completo.").max(80),
  distributorNumber: z.string().trim().min(1, "Escribe tu número de distribuidor WeNow.").max(40),
  whatsapp: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .transform((s) => (s.length === 10 ? `52${s}` : s))
    .pipe(z.string().regex(/^\d{11,15}$/, "Tu WhatsApp debe tener 10 dígitos.")),
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  storeUrl: z.string().transform((v, ctx) => {
    const r = parseStoreUrl(v);
    if (!r.ok) ctx.addIssue({ code: "custom", message: r.error });
    return r.ok ? r.url : "";
  }),
  privacy: z.literal("on", { message: "Necesitamos tu autorización para usar tus datos." }),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export async function createApplication(input: ApplicationInput, origin: string) {
  const existing = await db
    .select({ id: schema.distributors.id })
    .from(schema.distributors)
    .where(or(eq(schema.distributors.email, input.email), eq(schema.distributors.distributorId, input.distributorNumber)));
  if (existing.length) return { ok: false as const, error: "Ya tienes un WeNow 360 registrado con ese correo o número de distribuidor. Escríbenos si necesitas ayuda." };
  const [pending] = await db
    .select({ id: schema.distributorApplications.id })
    .from(schema.distributorApplications)
    .where(and(eq(schema.distributorApplications.status, "pendiente"), or(eq(schema.distributorApplications.email, input.email), eq(schema.distributorApplications.distributorNumber, input.distributorNumber))));
  if (pending) return { ok: true as const };

  await db.insert(schema.distributorApplications).values({
    displayName: input.displayName,
    slug: slugify(input.displayName) || "distribuidor",
    email: input.email,
    whatsapp: input.whatsapp,
    distributorNumber: input.distributorNumber,
    storeUrl: input.storeUrl,
  });
  await notifyCorporate(input, origin).catch((e) => console.error("registro: aviso fallido", e instanceof Error ? e.name : e));
  return { ok: true as const };
}

async function notifyCorporate(input: ApplicationInput, origin: string) {
  const [corporate] = await db.select({ email: schema.distributors.email }).from(schema.distributors).where(eq(schema.distributors.slug, CORPORATE_SLUG));
  const to = (process.env.WENOW_CORPORATE_EMAIL ?? corporate?.email)?.toLowerCase();
  if (!to) return;
  const panel = `${origin}/admin/distribuidores`;
  const rows: [string, string][] = [
    ["Nombre", input.displayName],
    ["Número de distribuidor", input.distributorNumber],
    ["WhatsApp", `+${input.whatsapp}`],
    ["Correo", input.email],
    ["Enlace de la tienda", input.storeUrl],
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#fbf6f8;padding:24px"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;color:#383838">
<h1 style="margin:0;font-size:20px">Nueva solicitud de WeNow 360</h1>
<p style="margin:10px 0 16px;font-size:14px;line-height:1.6;color:#4a4547">Un distribuidor pidió su enlace de WeNow 360. Revisa que su número de distribuidor sea correcto y apruébalo o recházalo en el panel.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6f6a6c;width:45%">${esc(k)}</td><td style="padding:6px 0;font-weight:700">${esc(v)}</td></tr>`).join("")}</table>
<a href="${esc(panel)}" style="display:inline-block;margin-top:18px;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">Revisar en el panel</a>
</div></div>`;
  const text = ["Nueva solicitud de WeNow 360", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Revisar en el panel: ${panel}`].join("\n");
  await sendViaResend({ to, subject: `Solicitud de WeNow 360: ${input.displayName}`, html, text, idempotencyKey: `registro-${input.email}-${input.distributorNumber}`, tag: "distributor_application" });
}
