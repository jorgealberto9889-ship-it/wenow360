import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db, schema } from "@/db";
import { card, esc, h2, layout, loadContext, resultUrlFor, send, storeUrlFromResult, type Context } from "./email";
import { MEMBERSHIP_PITCH, money } from "./labels";

// Correos comerciales (finalidad secundaria del aviso de privacidad, §4): solo con consentimiento
// de marketing, siempre con enlace de baja, y programados en Resend para poder cancelarlos.
const KIT_REMINDER_AFTER_H = 20;
const CHECKIN_AFTER_DAYS = 7;
const HOUR = 60 * 60 * 1000;

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

export async function signUnsubscribeToken(assessmentId: string) {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(assessmentId).setAudience("unsubscribe").setIssuedAt().sign(key());
}

export async function verifyUnsubscribeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "unsubscribe" });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

const unsubscribeFooter = (url: string) =>
  `<tr><td style="padding:6px 4px 0;font-size:11px;line-height:1.5;color:#8a8587">Recibes este correo porque aceptaste recibir recordatorios y tips de bienestar al completar tu WeNow 360. <a href="${esc(url)}" style="color:#8a8587">Darme de baja</a>.</td></tr>`;

// Recordatorio a las 20 h: su kit sigue listo en la tienda. Sin fechas límite ni urgencia.
export function buildKitReminder(ctx: Context, resultUrl: string, unsubscribeUrl: string) {
  const first = ctx.name.trim().split(/\s+/)[0] ?? ctx.name;
  const { products } = ctx.snapshot;
  const pub = products.reduce((s, p) => s + p.publicPrice, 0);
  const pay = products.reduce((s, p) => s + p.distributorPrice, 0);
  const storeUrl = storeUrlFromResult(resultUrl);
  const wa = `https://wa.me/${ctx.distributorWhatsapp}`;
  const html = layout(
    [
      card(
        `<div style="font-size:22px;line-height:1.3;font-weight:800;color:#383838">${esc(first)}, tu kit sigue listo</div>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#4a4547">Lo armamos con base en tu WeNow 360. Cuando quieras, está a un clic en la tienda WeNow, con ${esc(ctx.distributorName)} como tu asesor.</p>`,
      ),
      card(
        h2("Tu kit sugerido") +
          products.map((p) => `<div style="font-size:14px;padding:4px 0">• ${esc(p.name)}</div>`).join("") +
          `<p style="margin:12px 0 0;font-size:14px;line-height:1.55;color:#4a4547">${esc(MEMBERSHIP_PITCH)}: tu kit te queda en <strong style="color:#383838">${money(pay)}</strong> en lugar de ${money(pub)} a precio público.</p>` +
          `<a href="${esc(storeUrl)}" style="display:inline-block;margin-top:14px;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px">Comprar ahora</a>
<p style="margin:12px 0 0;font-size:13px;line-height:1.7"><a href="${esc(wa)}" style="color:#0d9a56;font-weight:700">Prefiero hablar con ${esc(ctx.distributorName)} por WhatsApp</a><br><a href="${esc(resultUrl)}" style="color:#a51959">Volver a ver mi resultado</a></p>`,
      ),
      `<tr><td style="padding:0 4px 8px;font-size:12px;color:#6f6a6c">Si ya hiciste tu compra, gracias; puedes ignorar este mensaje.</td></tr>`,
      unsubscribeFooter(unsubscribeUrl),
    ].join(""),
    `Tu kit sugerido sigue listo en la tienda WeNow.`,
  );
  const text = [
    `${first}, tu kit sigue listo.`,
    "",
    "Tu kit sugerido:",
    ...products.map((p) => `• ${p.name}`),
    `${MEMBERSHIP_PITCH}: tu kit te queda en ${money(pay)} en lugar de ${money(pub)}.`,
    "",
    `Comprar ahora: ${storeUrl}`,
    `Hablar con ${ctx.distributorName}: ${wa}`,
    `Tu resultado: ${resultUrl}`,
    "",
    "Si ya hiciste tu compra, puedes ignorar este mensaje.",
    `Darme de baja: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject: `${first}, tu kit sigue listo`, html, text };
}

export function buildCheckin(ctx: Context, resultUrl: string, unsubscribeUrl: string) {
  const first = ctx.name.trim().split(/\s+/)[0] ?? ctx.name;
  const habits = ctx.snapshot.result.habits.slice(0, 2);
  const hasKit = !ctx.snapshot.result.stopped && ctx.snapshot.products.length > 0;
  const wa = `https://wa.me/${ctx.distributorWhatsapp}`;
  const html = layout(
    [
      card(
        `<div style="font-size:22px;line-height:1.3;font-weight:800;color:#383838">Hola ${esc(first)}, ¿cómo vas?</div>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#4a4547">Hace unos días hiciste tu WeNow 360. Los cambios que se sostienen son los pequeños: aquí van los dos hábitos con los que te sugerimos empezar.</p>`,
      ),
      card(
        habits.map((h) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#4a4547"><strong style="color:#383838">${esc(h.title)}.</strong> ${esc(h.detail)}</p>`).join("") +
          `<p style="margin:6px 0 0;font-size:13.5px;color:#4a4547">¿Tienes dudas sobre tu resultado o tus productos? ${esc(ctx.distributorName)} puede ayudarte.</p>
<a href="${esc(wa)}" style="display:inline-block;margin-top:14px;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px">Escribir por WhatsApp</a>
<p style="margin:12px 0 0;font-size:13px;line-height:1.7">${hasKit ? `<a href="${esc(storeUrlFromResult(resultUrl))}" style="color:#a51959;font-weight:700">Ver mi kit en la tienda</a><br>` : ""}<a href="${esc(resultUrl)}" style="color:#a51959">Volver a ver mi resultado</a></p>`,
      ),
      `<tr><td style="padding:0 4px 8px;font-size:11px;color:#8a8587">Este mensaje es informativo y no sustituye la valoración de un profesional de salud.</td></tr>`,
      unsubscribeFooter(unsubscribeUrl),
    ].join(""),
    "Dos hábitos para seguir avanzando con tu bienestar.",
  );
  const text = [
    `Hola ${first}, ¿cómo vas?`,
    "Los dos hábitos con los que te sugerimos empezar:",
    ...habits.map((h) => `• ${h.title}. ${h.detail}`),
    "",
    `¿Dudas? Escribe a ${ctx.distributorName}: ${wa}`,
    ...(hasKit ? [`Tu kit en la tienda: ${storeUrlFromResult(resultUrl)}`] : []),
    `Tu resultado: ${resultUrl}`,
    "",
    `Darme de baja: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject: `${first}, ¿cómo vas con tu bienestar?`, html, text };
}

export async function scheduleFollowUps(assessmentId: string, origin: string) {
  const ctx = await loadContext(assessmentId);
  if (!ctx?.marketingAccepted) return;

  const [meta] = await db
    .select({ resultId: schema.assessmentResults.id, completedAt: schema.assessments.completedAt })
    .from(schema.assessments)
    .innerJoin(schema.assessmentResults, eq(schema.assessmentResults.assessmentId, schema.assessments.id))
    .where(eq(schema.assessments.id, assessmentId));
  if (!meta?.completedAt) return;

  const completed = Date.parse(meta.completedAt);
  const resultUrl = await resultUrlFor(assessmentId, origin);
  const unsubscribeUrl = `${origin}/baja/${await signUnsubscribeToken(assessmentId)}`;
  const productIds = ctx.snapshot.products.map((p) => p.id);

  const plan: { kind: "recordatorio_promo" | "seguimiento"; at: number; email: ReturnType<typeof buildCheckin> }[] = [];
  // El tipo sigue llamándose "recordatorio_promo" en la base; hoy es el recordatorio del kit (20 h).
  if (productIds.length > 0 && !ctx.snapshot.result.stopped) {
    plan.push({ kind: "recordatorio_promo", at: completed + KIT_REMINDER_AFTER_H * HOUR, email: buildKitReminder(ctx, resultUrl, unsubscribeUrl) });
  }
  plan.push({ kind: "seguimiento", at: completed + CHECKIN_AFTER_DAYS * 24 * HOUR, email: buildCheckin(ctx, resultUrl, unsubscribeUrl) });

  for (const item of plan) {
    const scheduledAt = new Date(item.at).toISOString();
    const r = await send(assessmentId, item.kind, {
      ...item.email,
      to: ctx.email,
      idempotencyKey: `${item.kind}-${assessmentId}`,
      tag: item.kind,
      scheduledAt,
    });
    await db.insert(schema.followUpTasks).values({
      assessmentResultId: meta.resultId,
      kind: item.kind,
      triggerType: "automatico",
      scheduledAt,
      productIdsToSuggest: productIds,
      providerEmailId: r.ok ? r.id : null,
      status: r.ok ? "enviado" : "cancelado",
    });
  }
}

// Revoca el consentimiento de marketing y cancela en Resend los correos programados que sigan pendientes.
export async function unsubscribe(assessmentId: string) {
  await db
    .update(schema.consents)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(schema.consents.assessmentId, assessmentId), eq(schema.consents.consentType, "marketing"), isNull(schema.consents.revokedAt)));

  const tasks = await db
    .select({ id: schema.followUpTasks.id, emailId: schema.followUpTasks.providerEmailId, scheduledAt: schema.followUpTasks.scheduledAt })
    .from(schema.followUpTasks)
    .innerJoin(schema.assessmentResults, eq(schema.assessmentResults.id, schema.followUpTasks.assessmentResultId))
    .where(and(eq(schema.assessmentResults.assessmentId, assessmentId), eq(schema.followUpTasks.status, "enviado"), isNotNull(schema.followUpTasks.providerEmailId)));

  for (const t of tasks) {
    if (t.scheduledAt && Date.parse(t.scheduledAt) <= Date.now()) continue;
    const res = await fetch(`https://api.resend.com/emails/${t.emailId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    }).catch(() => null);
    if (res?.ok) await db.update(schema.followUpTasks).set({ status: "cancelado" }).where(eq(schema.followUpTasks.id, t.id));
  }
  await db.insert(schema.auditLogs).values({ actorType: "system", action: "marketing_unsubscribed", entity: "assessments", entityId: assessmentId });
}
