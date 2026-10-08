import "server-only";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { scanProvider } from "./scan-provider";
import { signScanToken } from "./scan-token";

const API_BASE = "https://api.rouast.com/vitallens-v3";
export const SESSION_TTL_MS = 3 * 60 * 1000;
// La librería envía ~5 peticiones por segundo; un escaneo de 45 s ronda 230-270. El tope evita abusos
// sin cortar un escaneo normal.
const MAX_REQUESTS_PER_SESSION = 450;
// Mismo umbral que usa el widget oficial de VitalLens para mostrar un valor.
export const MIN_CONFIDENCE = 0.8;
// Mínimo de fragmentos con señal de buena calidad (≥ MIN_CONFIDENCE) para aceptar una frecuencia:
// ~8 s de señal limpia. Se cuentan fragmentos buenos en vez de promediar, para que los primeros
// segundos (mientras la cámara ubica el rostro) no invaliden un buen escaneo.
const MIN_GOOD_CHUNKS = 40;
const PLAUSIBLE = { heart: [35, 200], respiratory: [4, 40], hrv: [1, 400], stress: [0, 10], parasympathetic: [0, 100] } as const;

export async function createScanSession() {
  const [row] = await db
    .insert(schema.scanSessions)
    .values({ expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() })
    .returning({ id: schema.scanSessions.id });
  return row.id;
}

export async function scansToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return db.$count(schema.scanSessions, sql`${schema.scanSessions.createdAt} >= ${start.toISOString()}`);
}

// Reserva un turno de la sesión de forma atómica: falla si no existe, expiró, terminó o llegó al tope.
async function claimRequest(sessionId: string) {
  const rows = await db
    .update(schema.scanSessions)
    .set({ apiRequests: sql`${schema.scanSessions.apiRequests} + 1` })
    .where(
      and(
        eq(schema.scanSessions.id, sessionId),
        isNull(schema.scanSessions.finishedAt),
        gt(schema.scanSessions.expiresAt, new Date().toISOString()),
        lt(schema.scanSessions.apiRequests, MAX_REQUESTS_PER_SESSION),
      ),
    )
    .returning({ id: schema.scanSessions.id });
  return rows.length === 1;
}

const mean = (v: unknown) => {
  const list = (Array.isArray(v) ? v : [v]).filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
};

// En modo stream VitalLens devuelve señales (ondas de pulso y respiración con su confianza), no
// frecuencias: las frecuencias se calculan en el dispositivo. Aquí solo se mide la calidad de la señal.
export function extractSignalQuality(body: unknown) {
  const waveforms = (body as { waveforms?: Record<string, { confidence?: unknown }> })?.waveforms ?? {};
  let ppg: number | null = null;
  let resp: number | null = null;
  for (const [key, w] of Object.entries(waveforms)) {
    if (key.includes("ppg")) ppg = mean(w?.confidence);
    else if (key.includes("resp")) resp = mean(w?.confidence);
  }
  return { ppg, resp };
}

const FORWARDED_HEADERS = ["content-type", "x-state", "x-encoding"];

export async function proxyToVitalLens(sessionId: string, op: "resolve-model" | "file" | "stream", request: Request) {
  if (!(await claimRequest(sessionId))) {
    return Response.json({ message: "Sesión de escaneo inválida o expirada." }, { status: 403 });
  }

  const upstream = new URL(`${API_BASE}/${op}`);
  new URL(request.url).searchParams.forEach((v, k) => upstream.searchParams.set(k, v));
  const headers = new Headers({ "x-api-key": process.env.VITALLENS_API_KEY! });
  for (const h of FORWARDED_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  const res = await fetch(upstream, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : await request.arrayBuffer(),
  });
  const text = await res.text();

  if (res.ok && op !== "resolve-model") {
    try {
      const { ppg, resp } = extractSignalQuality(JSON.parse(text));
      if (ppg !== null) {
        const good = (c: number | null) => (c !== null && c >= MIN_CONFIDENCE ? 1 : 0);
        await db
          .update(schema.scanSessions)
          .set({
            signalChunks: sql`${schema.scanSessions.signalChunks} + 1`,
            ppgGoodChunks: sql`${schema.scanSessions.ppgGoodChunks} + ${good(ppg)}`,
            respGoodChunks: sql`${schema.scanSessions.respGoodChunks} + ${good(resp)}`,
          })
          .where(eq(schema.scanSessions.id, sessionId));
      } else if (process.env.NODE_ENV !== "production") {
        // Diagnóstico en desarrollo: solo nombres de campos, nunca valores.
        const b = JSON.parse(text) as Record<string, unknown>;
        console.warn("vitallens_sin_senal", { campos: Object.keys(b), ondas: Object.keys((b.waveforms as object) ?? {}) });
      }
    } catch {
      // Respuesta no-JSON: se reenvía tal cual; la librería maneja el error.
    }
  }

  return new Response(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json" } });
}

export type ClientReading = {
  heartRateBpm: number | null;
  heartRateConfidence: number | null;
  respiratoryRateBpm: number | null;
  respiratoryRateConfidence: number | null;
  hrvSdnnMs?: number | null;
  hrvLnrmssdMs?: number | null;
  stressIndex?: number | null;
  parasympatheticActivity?: number | null;
  hrSeries?: number[] | null;
};

// Reduce el pulso medido a 24 puntos plausibles equiespaciados (solo para dibujarlo).
function compactSeries(list: number[] | null | undefined) {
  const ok = (list ?? []).filter((n) => n >= PLAUSIBLE.heart[0] && n <= PLAUSIBLE.heart[1]);
  if (ok.length < 3) return null;
  const n = Math.min(24, ok.length);
  return Array.from({ length: n }, (_, i) => Math.round(ok[Math.round((i * (ok.length - 1)) / Math.max(1, n - 1))]));
}

export async function finishScanSession(sessionId: string, reading: ClientReading) {
  const [row] = await db
    .update(schema.scanSessions)
    .set({ finishedAt: new Date().toISOString() })
    .where(and(eq(schema.scanSessions.id, sessionId), isNull(schema.scanSessions.finishedAt)))
    .returning();
  if (!row) return { ok: false as const, reason: "invalid_session" as const };
  // Con VitalLens, el servidor ve la calidad de la señal (proxy) y exige fragmentos buenos. Shen.AI mide en el
  // dispositivo y solo entrega resultados cuando su propio control de calidad aprobó la medición (si la
  // respiración no fue confiable la devuelve vacía), así que aquí basta con validar los rangos.
  const onDevice = scanProvider() === "shenai";
  const accept = (value: number | null, clientConf: number | null, goodChunks: number, [lo, hi]: readonly [number, number]) =>
    value !== null && value >= lo && value <= hi && (onDevice || ((clientConf ?? 0) >= MIN_CONFIDENCE && goodChunks >= MIN_GOOD_CHUNKS))
      ? Math.round(value * 10) / 10
      : null;
  // Las 3 mediciones extra solo existen con Shen.AI (en el dispositivo); con VitalLens se descartan.
  const extra = (value: number | null | undefined, [lo, hi]: readonly [number, number]) =>
    onDevice && typeof value === "number" && value >= lo && value <= hi ? Math.round(value * 10) / 10 : null;
  const accepted = {
    heartRateBpm: accept(reading.heartRateBpm, reading.heartRateConfidence, row.ppgGoodChunks, PLAUSIBLE.heart),
    respiratoryRateBpm: accept(reading.respiratoryRateBpm, reading.respiratoryRateConfidence, row.respGoodChunks, PLAUSIBLE.respiratory),
    hrvSdnnMs: extra(reading.hrvSdnnMs, PLAUSIBLE.hrv),
    hrvLnrmssdMs: extra(reading.hrvLnrmssdMs, PLAUSIBLE.hrv),
    stressIndex: extra(reading.stressIndex, PLAUSIBLE.stress),
    parasympatheticActivity: extra(reading.parasympatheticActivity, PLAUSIBLE.parasympathetic),
    hrSeries: onDevice ? compactSeries(reading.hrSeries) : null,
  };

  await db
    .update(schema.scanSessions)
    .set({
      heartRateBpm: accepted.heartRateBpm,
      heartRateConfidence: reading.heartRateConfidence,
      respiratoryRateBpm: accepted.respiratoryRateBpm,
      respiratoryRateConfidence: reading.respiratoryRateConfidence,
    })
    .where(eq(schema.scanSessions.id, sessionId));

  if (Object.values({ ...accepted, hrSeries: null }).every((v) => v === null)) {
    return { ok: false as const, reason: "low_confidence" as const };
  }
  return {
    ok: true as const,
    scanToken: await signScanToken(accepted),
    readings: {
      heart: accepted.heartRateBpm !== null,
      respiratory: accepted.respiratoryRateBpm !== null,
      hrv: accepted.hrvSdnnMs !== null || accepted.hrvLnrmssdMs !== null,
      stress: accepted.stressIndex !== null,
      parasympathetic: accepted.parasympatheticActivity !== null,
    },
  };
}
