import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { computeMonthCosts, DEFAULT_SETTINGS, mergeSettings, renewalDate, type MonthUsage, type OwnerSettings } from "./usage-costs";

// Registra el consumo de un servicio con costo variable. Nunca interrumpe la respuesta al usuario: si falla, se ignora.
export async function recordUsage(e: { service: "gemini" | "tts"; scope: string; model?: string; inputUnits: number; outputUnits?: number }) {
  try {
    await db.insert(schema.usageEvents).values({
      service: e.service, scope: e.scope, model: e.model ?? "", inputUnits: Math.max(0, Math.round(e.inputUnits)), outputUnits: Math.max(0, Math.round(e.outputUnits ?? 0)),
    });
  } catch (err) {
    console.error("usage_record_failed", { name: (err as Error)?.name });
  }
}

const SETTINGS_KEY = "settings";

export async function loadSettings(): Promise<OwnerSettings> {
  const [row] = await db.select({ value: schema.ownerSettings.value }).from(schema.ownerSettings).where(eq(schema.ownerSettings.key, SETTINGS_KEY));
  if (!row) return DEFAULT_SETTINGS;
  try {
    return mergeSettings(JSON.parse(row.value) as Partial<OwnerSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: OwnerSettings) {
  const value = JSON.stringify(settings);
  await db
    .insert(schema.ownerSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: schema.ownerSettings.key, set: { value, updatedAt: new Date().toISOString() } });
}

// «2026-10» → [inicio, fin) en UTC. Sin parámetro, el mes actual.
export function monthRange(month?: string) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month ?? "");
  const now = new Date();
  const y = m ? Number(m[1]) : now.getUTCFullYear();
  const mo = m ? Number(m[2]) - 1 : now.getUTCMonth();
  return { key: `${y}-${String(mo + 1).padStart(2, "0")}`, start: new Date(Date.UTC(y, mo, 1)).toISOString(), end: new Date(Date.UTC(y, mo + 1, 1)).toISOString() };
}

export async function monthUsage(start: string, end: string): Promise<MonthUsage> {
  const n = async (q: ReturnType<typeof db.$count>) => Number(await q);
  const [scans, emails, assessments, questions, gem, tts, convResult, convPublic] = await Promise.all([
    n(db.$count(schema.scanSessions, and(gte(schema.scanSessions.createdAt, start), lt(schema.scanSessions.createdAt, end)))),
    n(db.$count(schema.emailEvents, and(eq(schema.emailEvents.status, "sent"), gte(schema.emailEvents.createdAt, start), lt(schema.emailEvents.createdAt, end)))),
    n(db.$count(schema.assessments, and(eq(schema.assessments.status, "completed"), gte(schema.assessments.completedAt, start), lt(schema.assessments.completedAt, end)))),
    n(db.$count(schema.assistantMessages, and(eq(schema.assistantMessages.role, "user"), gte(schema.assistantMessages.createdAt, start), lt(schema.assistantMessages.createdAt, end)))),
    db
      .select({ i: sql<number>`coalesce(sum(${schema.usageEvents.inputUnits}), 0)`, o: sql<number>`coalesce(sum(${schema.usageEvents.outputUnits}), 0)` })
      .from(schema.usageEvents)
      .where(and(eq(schema.usageEvents.service, "gemini"), gte(schema.usageEvents.createdAt, start), lt(schema.usageEvents.createdAt, end))),
    db
      .select({ i: sql<number>`coalesce(sum(${schema.usageEvents.inputUnits}), 0)` })
      .from(schema.usageEvents)
      .where(and(eq(schema.usageEvents.service, "tts"), gte(schema.usageEvents.createdAt, start), lt(schema.usageEvents.createdAt, end))),
    // Conversaciones en el resultado: una por evaluación con mensajes en el mes.
    db
      .select({ n: sql<number>`count(distinct ${schema.assistantMessages.assessmentId})` })
      .from(schema.assistantMessages)
      .where(and(gte(schema.assistantMessages.createdAt, start), lt(schema.assistantMessages.createdAt, end))),
    // Conversaciones de la portada: un visitante por día (la llave guarda día y huella).
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.winnieUsage)
      .where(and(sql`${schema.winnieUsage.key} like 'v:%'`, gte(schema.winnieUsage.updatedAt, start), lt(schema.winnieUsage.updatedAt, end))),
  ]);
  return {
    scans, emails, assessments, winnieQuestions: questions, conversations: Number(convResult[0]?.n ?? 0) + Number(convPublic[0]?.n ?? 0),
    geminiIn: Number(gem[0]?.i ?? 0), geminiOut: Number(gem[0]?.o ?? 0), ttsChars: Number(tts[0]?.i ?? 0),
  };
}

export async function monthReport(month?: string) {
  const range = monthRange(month);
  const [usage, settings] = await Promise.all([monthUsage(range.start, range.end), loadSettings()]);
  const daysToRenewal = Math.ceil((renewalDate(settings.annual).getTime() - Date.now()) / 86_400_000);
  return { range, usage, settings, daysToRenewal, costs: computeMonthCosts(usage, settings, range.start) };
}
