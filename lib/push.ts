import "server-only";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db, schema } from "@/db";
import { pushPayload, type PushMessage } from "./push-payload";

// Notificaciones push del portal del distribuidor (Web Push con claves VAPID). Sin claves no se envía nada y el
// portal no ofrece activarlas.
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY?.trim() || null;

function configured() {
  const pub = vapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || "mailto:hola@wenowglobal.com", pub, priv);
  return true;
}

export type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function saveSubscription(distributorId: number, sub: BrowserSubscription, userAgent: string) {
  const values = { distributorId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: userAgent.slice(0, 300) };
  await db
    .insert(schema.pushSubscriptions)
    .values(values)
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: values });
}

export async function removeSubscription(distributorId: number, endpoint: string) {
  const [row] = await db
    .select({ id: schema.pushSubscriptions.id, owner: schema.pushSubscriptions.distributorId })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint));
  if (row && row.owner === distributorId) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, row.id));
}

// Envía el aviso a todos los dispositivos del distribuidor. Las suscripciones vencidas (404/410) se borran.
export async function sendPushToDistributor(distributorId: number, message: PushMessage) {
  if (!configured()) return { sent: 0 };
  const subs = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.distributorId, distributorId));
  if (subs.length === 0) return { sent: 0 };
  const body = JSON.stringify(pushPayload(message));
  const gone: string[] = [];
  const ok: string[] = [];
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 24 * 60 * 60, urgency: "high" });
        ok.push(s.id);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 410: el navegador la dio de baja. 404 solo cuenta si no es recién creada (el servicio de push puede tardar en registrarla).
        const stale = status === 410 || (status === 404 && Date.now() - Date.parse(s.createdAt) > 10 * 60 * 1000);
        if (stale) gone.push(s.id);
        console.error("push_failed", { status: status ?? null, removed: stale });
      }
    }),
  );
  if (gone.length) await db.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.id, gone));
  if (ok.length) await db.update(schema.pushSubscriptions).set({ lastSentAt: new Date().toISOString() }).where(inArray(schema.pushSubscriptions.id, ok));
  return { sent: ok.length };
}

// Aviso de prospecto nuevo: solo si la persona autorizó que su asesor la contacte (misma regla que el correo al asesor).
export async function notifyNewProspect(assessmentId: string) {
  if (!configured()) return;
  const [row] = await db
    .select({ prospectId: schema.prospects.id, name: schema.prospects.name, distributorId: schema.distributors.id })
    .from(schema.assessments)
    .innerJoin(schema.prospects, eq(schema.prospects.id, schema.assessments.prospectId))
    .innerJoin(schema.distributors, eq(schema.distributors.slug, schema.assessments.distributorSlug))
    .where(eq(schema.assessments.id, assessmentId));
  if (!row) return;
  const consents = await db
    .select({ type: schema.consents.consentType, accepted: schema.consents.accepted, revokedAt: schema.consents.revokedAt })
    .from(schema.consents)
    .where(eq(schema.consents.assessmentId, assessmentId));
  if (!consents.some((c) => c.type === "contacto_asesor" && c.accepted && !c.revokedAt)) return;
  await sendPushToDistributor(row.distributorId, { kind: "nuevo_prospecto", name: row.name, prospectId: row.prospectId });
}
