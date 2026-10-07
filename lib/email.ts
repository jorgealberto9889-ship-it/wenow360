import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ResultSnapshot } from "./assessments";
import { BRAND } from "./brand";
import { AREA_STATUS, formatMexicoDateTime, MEMBERSHIP_PITCH, memberDiscountPct, money } from "./labels";
import { signResultToken } from "./result-link";
import { CORPORATE_SLUG } from "./submission";

type EmailType = typeof schema.emailEvents.$inferInsert.type;
export type Message = { to: string; subject: string; html: string; text: string; idempotencyKey: string; tag: string; scheduledAt?: string };

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!);

export async function sendViaResend(m: Message): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return { ok: false, error: "Resend no está configurado (RESEND_API_KEY / RESEND_FROM_EMAIL)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": m.idempotencyKey },
      body: JSON.stringify({
        from: `${process.env.RESEND_FROM_NAME ?? BRAND.emailFromName} <${from}>`,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
        tags: [{ name: "source", value: "wenow360" }, { name: "message_type", value: m.tag }],
        ...(m.scheduledAt ? { scheduled_at: m.scheduledAt } : {}),
      }),
    });
    const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (res.ok) return { ok: true, id: body?.id ?? null };
    return { ok: false, error: `Resend respondió ${res.status}: ${String(body?.message ?? "").slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: `Sin conexión con Resend: ${e instanceof Error ? e.message : "error desconocido"}` };
  }
}

export async function send(assessmentId: string, type: EmailType, m: Message) {
  const [event] = await db
    .insert(schema.emailEvents)
    .values({ assessmentId, recipient: m.to, type, provider: "resend", status: "pending" })
    .returning({ id: schema.emailEvents.id });
  const r = await sendViaResend(m);
  await db
    .update(schema.emailEvents)
    .set(r.ok ? { status: "sent", providerId: r.id } : { status: "failed", error: r.error })
    .where(eq(schema.emailEvents.id, event.id));
  return r.ok ? { ok: true as const, id: r.id } : { ok: false as const };
}

export async function loadContext(assessmentId: string) {
  const [row] = await db
    .select({
      prospectId: schema.prospects.id,
      name: schema.prospects.name,
      email: schema.prospects.email,
      phone: schema.prospects.phone,
      completedAt: schema.assessments.completedAt,
      snapshot: schema.assessmentResults.snapshot,
      distributorSlug: schema.distributors.slug,
      distributorName: schema.distributors.displayName,
      distributorEmail: schema.distributors.email,
      distributorWhatsapp: schema.distributors.whatsapp,
      distributorHasPortal: schema.distributors.portalPasswordHash,
    })
    .from(schema.assessments)
    .innerJoin(schema.prospects, eq(schema.prospects.id, schema.assessments.prospectId))
    .innerJoin(schema.assessmentResults, eq(schema.assessmentResults.assessmentId, schema.assessments.id))
    .innerJoin(schema.distributors, eq(schema.distributors.slug, schema.assessments.distributorSlug))
    .where(eq(schema.assessments.id, assessmentId));
  if (!row) return null;
  const consents = await db
    .select({ type: schema.consents.consentType, accepted: schema.consents.accepted, revokedAt: schema.consents.revokedAt })
    .from(schema.consents)
    .where(eq(schema.consents.assessmentId, assessmentId));
  const has = (t: string) => consents.some((c) => c.type === t && c.accepted && !c.revokedAt);
  return {
    ...row,
    distributorHasPortal: Boolean(row.distributorHasPortal),
    snapshot: row.snapshot as ResultSnapshot,
    advisorAccepted: has("contacto_asesor"),
    marketingAccepted: has("marketing"),
  };
}

export type Context = NonNullable<Awaited<ReturnType<typeof loadContext>>>;

export function layout(inner: string, preheader: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#faf7f8;font-family:Helvetica,Arial,sans-serif;color:#2b2b2b">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px;font-size:15px;font-weight:800;color:#383838">WeNow 360 <span style="font-weight:500;color:#6f6a6c">· Bienestar</span></td></tr>
${inner}
</table></td></tr></table></body></html>`;
}

export const card = (content: string, style = "background:#ffffff;border:1px solid #e6e0e3") =>
  `<tr><td style="padding:0 0 14px"><div style="${style};border-radius:18px;padding:20px">${content}</div></td></tr>`;
export const h2 = (t: string) => `<div style="font-size:16px;font-weight:800;color:#383838;margin:0 0 10px">${esc(t)}</div>`;

export function buildResultEmail(ctx: Context, resultUrl: string): Omit<Message, "to" | "idempotencyKey" | "tag"> {
  const { result, products } = ctx.snapshot;
  const first = ctx.name.trim().split(/\s+/)[0] ?? ctx.name;
  const pub = products.reduce((s, p) => s + p.publicPrice, 0);
  const pref = products.reduce((s, p) => s + p.distributorPrice, 0);
  const pay = pref;
  const discount = memberDiscountPct(pub, pay);
  const storeUrl = storeUrlFromResult(resultUrl);
  const habits = result.habits.slice(0, 3);
  const wa = `https://wa.me/${ctx.distributorWhatsapp}`;

  const html = layout(
    [
      card(`<div style="font-size:24px;line-height:1.25;font-weight:800;color:#383838">Hola ${esc(first)}, tu evaluación está lista</div>
<p style="margin:10px 0 18px;font-size:14px;line-height:1.6;color:#4a4547">Aquí tienes un resumen. Tu resultado completo, con el detalle de cada producto, está en el enlace.</p>
<a href="${esc(resultUrl)}" style="display:inline-block;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px">Ver mi resultado completo</a>`),
      card(
        h2("Tus áreas de enfoque") +
          result.areas
            .map((a) => `<div style="padding:8px 0;border-top:1px solid #f2efef;font-size:14px"><strong style="color:#383838">${esc(a.title)}</strong> <span style="color:#6f6a6c">· ${AREA_STATUS[a.score]}</span></div>`)
            .join(""),
      ),
      result.medicalAttention
        ? card(`<strong style="color:#383838">${esc(result.medicalAttention.title)}</strong><p style="margin:6px 0 0;font-size:13px;line-height:1.55;color:#5a4a2e">${esc(result.medicalAttention.detail)}</p>`, "background:#fff8ec;border:1px solid #f0d9a8")
        : "",
      card(
        h2("Para empezar esta semana") +
          habits.map((h) => `<p style="margin:0 0 10px;font-size:13.5px;line-height:1.55;color:#4a4547"><strong style="color:#383838">${esc(h.title)}.</strong> ${esc(h.detail)}</p>`).join(""),
      ),
      products.length
        ? card(
            h2("Tu kit sugerido") +
              products
                .map((p) => `<div style="padding:9px 0;border-top:1px solid #f2efef;font-size:14px"><strong style="color:#383838">${esc(p.name)}</strong><br><span style="color:#6f6a6c;font-size:12.5px">${esc(p.eyebrow)} · <s>${money(p.publicPrice)}</s> <strong style="color:#087748">${money(p.distributorPrice)} miembro</strong></span></div>`)
                .join("") +
              `<div style="margin-top:12px;padding:14px;border-radius:14px;background:#0b8f55;color:#ffffff;text-align:center"><div style="font-size:11px;letter-spacing:.08em;font-weight:700">PRECIO MIEMBRO ${esc(BRAND.club.toUpperCase())}</div><div style="font-size:26px;font-weight:800;margin-top:2px">${money(pay)}</div><div style="font-size:12.5px">en lugar de ${money(pub)} a precio público${discount ? ` (${discount}% menos)` : ""}</div></div>` +
              `<p style="margin:14px 0 4px;font-size:13px;line-height:1.5;color:#4a4547">${esc(MEMBERSHIP_PITCH)}.</p>` +
              `<a href="${esc(storeUrl)}" style="display:inline-block;margin-top:8px;background:#a51959;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px">Comprar ahora</a>`,
          )
        : "",
      card(`<div style="font-size:13.5px;color:#4a4547">Tu asesor: <strong style="color:#383838">${esc(ctx.distributorName)}</strong></div><a href="${wa}" style="display:inline-block;margin-top:10px;color:#0d9a56;font-weight:700;font-size:14px;text-decoration:none">Escribirle por WhatsApp →</a>`),
      `<tr><td style="padding:6px 4px 0;font-size:11px;line-height:1.5;color:#8a8587">Este resultado es informativo y no sustituye la valoración de un profesional de salud. Los productos sugeridos no son medicamentos. Recibes este correo porque completaste tu WeNow 360.</td></tr>`,
    ].join(""),
    "Tu resultado personalizado y tu kit sugerido.",
  );

  const text = [
    `Hola ${first}, tu evaluación WeNow 360 está lista.`,
    `Ver tu resultado completo: ${resultUrl}`,
    "",
    "Tus áreas de enfoque:",
    ...result.areas.map((a) => `• ${a.title} · ${AREA_STATUS[a.score]}`),
    "",
    "Para empezar esta semana:",
    ...habits.map((h) => `• ${h.title}. ${h.detail}`),
    ...(products.length
      ? ["", "Tu kit sugerido:", ...products.map((p) => `• ${p.name} · ${money(p.distributorPrice)} miembro (público ${money(p.publicPrice)})`), `Precio miembro ${BRAND.club}: ${money(pay)} en lugar de ${money(pub)} a precio público.`, `Comprar ahora: ${storeUrl}`]
      : []),
    "",
    `Tu asesor: ${ctx.distributorName} · ${wa}`,
    "",
    "Este resultado es informativo y no sustituye la valoración de un profesional de salud.",
  ].join("\n");

  return { subject: `${first}, tu resultado WeNow 360 está listo`, html, text };
}

// ---------- Aviso al distribuidor y copia corporativa ----------
// Por privacidad nunca incluyen condiciones, medicamentos, respuestas del cuestionario, lectura biométrica
// ni la conversación con Winnie (aviso §6).

const PRIORITY: Record<string, string> = { esencial: "Esencial", prioritaria: "Prioritaria", complementaria: "Complementaria" };
const button = (href: string, label: string, bg = "#a51959") =>
  `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:999px;margin:4px 6px 0 0">${esc(label)}</a>`;
const waDigits = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `52${d}` : d;
};

function leadSummary(ctx: Context) {
  const { result, products } = ctx.snapshot;
  const pub = products.reduce((s, p) => s + p.publicPrice, 0);
  const pref = products.reduce((s, p) => s + p.distributorPrice, 0);
  const pay = pref;
  const areas = result.areas.filter((a) => a.metric);

  const areasHtml = card(
    h2("Áreas que más atención le piden") +
      (areas.length ? areas : result.areas)
        .map((a) => `<div style="padding:8px 0;border-top:1px solid #f2efef;font-size:14px"><strong style="color:#383838">${esc(a.title)}</strong> <span style="color:#6f6a6c">· ${AREA_STATUS[a.score]}</span></div>`)
        .join(""),
  );
  const productsHtml =
    result.stopped || products.length === 0
      ? card(`${h2("Productos sugeridos")}<p style="margin:0;font-size:13.5px;line-height:1.55;color:#5a4a2e">A esta persona no se le sugirieron productos: su perfil requiere orientación profesional. Acompáñala sin ofrecerle productos.</p>`, "background:#fff8ec;border:1px solid #f0d9a8")
      : card(
          h2("Su kit sugerido") +
            products
              .map((p) => {
                const rec = result.recommendations.find((r) => r.productId === p.id);
                return `<div style="padding:9px 0;border-top:1px solid #f2efef;font-size:14px"><strong style="color:#383838">${esc(p.name)}</strong> <span style="font-size:11.5px;color:#a51959;font-weight:700">${PRIORITY[rec?.priorityLabel ?? "complementaria"]}</span><br><span style="color:#6f6a6c;font-size:12.5px">${esc(p.eyebrow)} · <s>${money(p.publicPrice)}</s> <strong style="color:#087748">${money(p.distributorPrice)} miembro</strong></span></div>`;
              })
              .join("") +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:13px;color:#4a4547">
<tr><td style="padding:3px 0">A precio público</td><td align="right"><s>${money(pub)}</s></td></tr>
<tr><td style="padding:3px 0">Con precio miembro del ${BRAND.club}</td><td align="right" style="font-size:18px;font-weight:800;color:#383838">${money(pay)}</td></tr>
<tr><td style="padding:3px 0;color:#087748;font-weight:700">Se ahorra</td><td align="right" style="color:#087748;font-weight:800">${money(Math.max(0, pub - pay))}</td></tr></table>`,
        );
  const kitLine = !result.stopped && products.length
    ? `Su kit suma ${money(pub)} a precio público; con precio miembro le queda en ${money(pay)}.`
    : "No se le sugirieron productos.";
  const text = [
    "Áreas que más atención le piden:",
    ...(areas.length ? areas : result.areas).map((a) => `• ${a.title} · ${AREA_STATUS[a.score]}`),
    "",
    ...(result.stopped || products.length === 0
      ? ["No se le sugirieron productos: su perfil requiere orientación profesional."]
      : [
          "Su kit sugerido:",
          ...products.map((p) => `• ${p.name} · ${money(p.distributorPrice)} miembro (público ${money(p.publicPrice)})`),
          `Total miembro: ${money(pay)} (público ${money(pub)}).`,
        ]),
  ];
  return { html: areasHtml + productsHtml, text, kitLine, hasProducts: !result.stopped && products.length > 0 };
}

const PRIVACY_NOTE = `<tr><td style="padding:6px 4px 0;font-size:11px;line-height:1.5;color:#8a8587">Por privacidad, este mensaje no incluye padecimientos, medicamentos, respuestas del cuestionario ni la lectura biométrica.</td></tr>`;

export function buildAdvisorEmail(ctx: Context, links: { portal: string }): Omit<Message, "to" | "idempotencyKey" | "tag"> {
  const first = ctx.name.trim().split(/\s+/)[0] ?? ctx.name;
  const summary = leadSummary(ctx);
  const wa = waDigits(ctx.phone);
  const waText = encodeURIComponent(
    `Hola ${first}, soy ${ctx.distributorName}, tu asesor de bienestar WeNow. Vi tu resultado de WeNow 360 y me encantaría ayudarte con tus dudas. ¿Cuándo te queda bien que platiquemos?`,
  );
  const html = layout(
    [
      card(`<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#087748">NUEVO BIOCHECK · PIDIÓ QUE LO ACOMPAÑES</div>
<div style="font-size:22px;line-height:1.25;font-weight:800;color:#383838;margin-top:6px">${esc(ctx.name)} completó su WeNow 360</div>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#4a4547">Te eligió como su asesor y pidió que le acompañes. <strong>Escríbele pronto.</strong> ${esc(summary.kitLine)}</p>
<p style="margin:12px 0 4px;font-size:13.5px;line-height:1.7;color:#4a4547">📱 ${esc(ctx.phone)}<br>✉️ <a href="mailto:${esc(ctx.email)}" style="color:#a51959">${esc(ctx.email)}</a></p>
${wa ? button(`https://wa.me/${wa}?text=${waText}`, "Escribirle por WhatsApp", "#20c96b") : ""}${wa ? button(`tel:${ctx.phone}`, "Llamar", "#383838") : ""}`),
      summary.html,
      card(
        ctx.distributorHasPortal
          ? `<div style="font-size:14px;color:#4a4547;line-height:1.55">Lleva su seguimiento, cambia su estatus y agrega notas en tu portal.</div>${button(links.portal, "Abrir en mi portal")}`
          : `<div style="font-size:14px;color:#4a4547;line-height:1.55">Pronto podrás dar seguimiento a todos tus prospectos desde tu portal de WeNow 360. Pídele a WeNow tu acceso.</div>`,
      ),
      PRIVACY_NOTE,
    ].join(""),
    `${ctx.name} pidió que le acompañes. ${summary.kitLine}`,
  );
  const text = [
    `Nuevo WeNow 360: ${ctx.name} pidió que le acompañes.`,
    summary.kitLine,
    `Teléfono: ${ctx.phone} · Correo: ${ctx.email}`,
    ...(wa ? [`WhatsApp: https://wa.me/${wa}`] : []),
    "",
    ...summary.text,
    ...(ctx.distributorHasPortal ? ["", `Abrir en tu portal: ${links.portal}`] : []),
    "",
    "Por privacidad, este mensaje no incluye padecimientos, medicamentos, respuestas del cuestionario ni la lectura biométrica.",
  ].join("\n");
  return { subject: `Nuevo WeNow 360: ${ctx.name} pidió que le acompañes`, html, text };
}

// Copia informativa para WeNow: destaca a qué distribuidor pertenece el lead.
export function buildCorporateEmail(
  ctx: Context,
  links: { admin: string; distributorLink: string },
  distributorTotal: number,
): Omit<Message, "to" | "idempotencyKey" | "tag"> {
  const summary = leadSummary(ctx);
  const corporate = ctx.distributorSlug === CORPORATE_SLUG;
  const asked = ctx.advisorAccepted;
  const html = layout(
    [
      card(`<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#e6a9c5">NUEVO BIOCHECK · DISTRIBUIDOR</div>
<div style="font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;margin-top:6px">${esc(ctx.distributorName)}${corporate ? " (corporativo)" : ""}</div>
<p style="margin:10px 0 0;font-size:13.5px;line-height:1.7;color:#ecd0dc">Enlace: <a href="${esc(links.distributorLink)}" style="color:#ffffff">${esc(links.distributorLink.replace(/^https?:\/\//, ""))}</a><br>
WhatsApp: <a href="https://wa.me/${esc(ctx.distributorWhatsapp)}" style="color:#ffffff">${esc(ctx.distributorWhatsapp)}</a>${ctx.distributorEmail ? `<br>Correo: <a href="mailto:${esc(ctx.distributorEmail)}" style="color:#ffffff">${esc(ctx.distributorEmail)}</a>` : ""}<br>
Evaluaciones con su enlace: <strong style="color:#ffffff">${distributorTotal}</strong> · Portal: ${ctx.distributorHasPortal ? "con acceso" : "sin acceso"}</p>`, "background:#383838;border:0"),
      card(`<div style="font-size:18px;font-weight:800;color:#383838">${esc(ctx.name)}</div>
<p style="margin:6px 0 0;font-size:13.5px;line-height:1.7;color:#4a4547">📱 ${esc(ctx.phone)} · ✉️ ${esc(ctx.email)}<br>${ctx.completedAt ? `Completó su WeNow 360 el ${esc(formatMexicoDateTime(ctx.completedAt))}` : ""}</p>
<p style="margin:10px 0 0;font-size:13px;font-weight:700;color:${asked ? "#087748" : "#8a6412"}">${asked ? "✓ Pidió que su asesor lo contacte" : "No pidió que lo contacten"}${ctx.marketingAccepted ? " · Aceptó recordatorios por correo" : ""}</p>
${button(links.admin, "Ver su ficha en el panel")}`),
      summary.html,
      PRIVACY_NOTE,
    ].join(""),
    `${ctx.name} hizo su WeNow 360 con ${ctx.distributorName}.`,
  );
  const text = [
    `Nuevo WeNow 360 con el enlace de ${ctx.distributorName}${corporate ? " (corporativo)" : ""}.`,
    `Enlace: ${links.distributorLink} · WhatsApp: ${ctx.distributorWhatsapp}${ctx.distributorEmail ? ` · Correo: ${ctx.distributorEmail}` : ""}`,
    `Evaluaciones con su enlace: ${distributorTotal}`,
    "",
    `Lead: ${ctx.name} · ${ctx.phone} · ${ctx.email}`,
    asked ? "Pidió que su asesor lo contacte." : "No pidió que lo contacten.",
    "",
    ...summary.text,
    "",
    `Ficha en el panel: ${links.admin}`,
  ].join("\n");
  return { subject: `[WeNow 360] ${ctx.distributorName} · nuevo lead: ${ctx.name}`, html, text };
}

// Enlace de compra que corresponde a un enlace de resultado (/r/<token> → /tienda/<token>).
export const storeUrlFromResult = (resultUrl: string) => resultUrl.replace(/\/r\/([^/?#]+)$/, "/tienda/$1");

export async function resultUrlFor(assessmentId: string, origin: string) {
  return `${origin}/r/${await signResultToken(assessmentId)}`;
}

export async function sendAssessmentEmails(assessmentId: string, origin: string) {
  const ctx = await loadContext(assessmentId);
  if (!ctx) return;
  const resultUrl = await resultUrlFor(assessmentId, origin);
  const tasks: Promise<unknown>[] = [
    send(assessmentId, "resultado", { ...buildResultEmail(ctx, resultUrl), to: ctx.email, idempotencyKey: `resultado-${assessmentId}`, tag: "wellness_result" }),
  ];

  // Distribuidor: solo cuando la persona pidió que la acompañe (aviso de privacidad §3).
  const distributorEmail = ctx.distributorEmail?.toLowerCase() ?? null;
  if (ctx.advisorAccepted && distributorEmail) {
    const advisor = buildAdvisorEmail(ctx, { portal: `${origin}/portal/prospecto/${ctx.prospectId}` });
    tasks.push(send(assessmentId, "notificacion_asesor", { ...advisor, to: distributorEmail, idempotencyKey: `asesor-${assessmentId}`, tag: "advisor_notification" }));
  }

  // WeNow: copia informativa de cada WeNow 360, con el distribuidor destacado.
  const [corporate] = await db.select({ email: schema.distributors.email }).from(schema.distributors).where(eq(schema.distributors.slug, CORPORATE_SLUG));
  const corporateEmail = (process.env.WENOW_CORPORATE_EMAIL ?? corporate?.email)?.toLowerCase();
  if (corporateEmail) {
    const distributorTotal = await db.$count(
      schema.assessments,
      and(eq(schema.assessments.distributorSlug, ctx.distributorSlug), eq(schema.assessments.status, "completed")),
    );
    const copy = buildCorporateEmail(
      ctx,
      { admin: `${origin}/admin/prospectos/${ctx.prospectId}`, distributorLink: `${origin}/d/${ctx.distributorSlug}` },
      distributorTotal,
    );
    tasks.push(send(assessmentId, "copia_corporativa", { ...copy, to: corporateEmail, idempotencyKey: `corporativo-${assessmentId}`, tag: "corporate_copy" }));
  }
  await Promise.allSettled(tasks);
}
