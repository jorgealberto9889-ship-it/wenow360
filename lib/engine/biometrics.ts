export type BiometricInput = {
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  // Shen.AI (plan de 500): VFC, índice de estrés (0–10) y actividad parasimpática (%). VitalLens no los entrega.
  hrvSdnnMs?: number | null;
  hrvLnrmssdMs?: number | null;
  stressIndex?: number | null;
  parasympatheticActivity?: number | null;
  // Pulso medido durante el minuto (hasta 24 puntos, solo Shen.AI): se dibuja en el panel.
  hrSeries?: number[] | null;
};

export type QualitativeReading = {
  label: "Dentro de lo típico" | "Ligeramente acelerada" | "Más pausada de lo típico";
  context: string;
};

// Estado del índice de estrés según la escala de Shen.AI (0–10): 0–4 referencia, 5–8 elevada, 9–10 muy elevada.
export type StressReading = { label: "Dentro de la referencia" | "Carga elevada" | "Carga muy elevada"; context: string };

// Valores crudos para el panel (la clasificación va aparte). La VFC no tiene rango universal: se muestra sin juzgar.
export type BiometricValues = {
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  hrvSdnnMs: number | null;
  hrvLnrmssdMs: number | null;
  stressIndex: number | null;
  parasympatheticActivity: number | null;
  hrSeries: number[] | null;
};

// Índice WeNow de bienestar (0–100): promedio de lo que tiene rango de referencia documentado (pulso, respiración
// e índice de estrés). La VFC y la actividad parasimpática no tienen rango universal, así que no puntúan.
// Es una síntesis orientativa de WeNow, no una medida clínica.
export type WellnessSummary = { score: number; label: "Óptimo" | "Bueno" | "A cuidar"; message: string; inRange: number; total: number };

export type BiometricReading = {
  heartRate: QualitativeReading | null;
  respiratoryRate: QualitativeReading | null;
  stress: StressReading | null;
  values: BiometricValues;
  wellness?: WellnessSummary | null;
};

// Rangos típicos en reposo para adultos: FC 60–100 lpm, FR 12–20 rpm.
const HR = { low: 60, high: 100 };
const RR = { low: 12, high: 20 };

function classify(value: number | null, range: { low: number; high: number }, typical: string, fast: string, slow: string) {
  if (value === null || !Number.isFinite(value)) return null;
  if (value > range.high) return { label: "Ligeramente acelerada", context: fast } as const;
  if (value < range.low) return { label: "Más pausada de lo típico", context: slow } as const;
  return { label: "Dentro de lo típico", context: typical } as const;
}

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

// Cada componente vale 100 dentro de su referencia y baja de forma gradual al alejarse.
export const heartScore = (bpm: number) => clamp(bpm >= HR.low && bpm <= 80 ? 100 : bpm > 80 && bpm <= HR.high ? 100 - ((bpm - 80) / 20) * 20 : bpm > HR.high ? 80 - (bpm - HR.high) * 1.5 : 100 - (HR.low - bpm) * 2.5);
export const breathScore = (rpm: number) => clamp(rpm >= RR.low && rpm <= RR.high ? 100 : 100 - Math.min(Math.abs(rpm < RR.low ? RR.low - rpm : rpm - RR.high), 8) * 8);
export const stressScore = (idx: number) => clamp(idx <= 4 ? 100 - (idx / 4) * 12 : idx <= 8 ? 88 - ((idx - 4) / 4) * 48 : 40 - ((idx - 8) / 2) * 30);

export function summarizeWellness(v: BiometricValues): WellnessSummary | null {
  const parts = [
    v.heartRateBpm !== null && { score: heartScore(v.heartRateBpm), ok: v.heartRateBpm >= HR.low && v.heartRateBpm <= HR.high },
    v.respiratoryRateBpm !== null && { score: breathScore(v.respiratoryRateBpm), ok: v.respiratoryRateBpm >= RR.low && v.respiratoryRateBpm <= RR.high },
    v.stressIndex !== null && { score: stressScore(v.stressIndex), ok: v.stressIndex < STRESS_HIGH },
  ].filter(Boolean) as { score: number; ok: boolean }[];
  if (parts.length < 2) return null;
  const score = Math.round(parts.reduce((a, p) => a + p.score, 0) / parts.length);
  const inRange = parts.filter((p) => p.ok).length;
  const [label, message]: [WellnessSummary["label"], string] =
    score >= 80 ? ["Óptimo", "Tus indicadores se encuentran dentro de rangos de referencia."]
    : score >= 60 ? ["Bueno", "La mayoría de tus indicadores está en rangos de referencia; hay espacio para cuidarte un poco más."]
    : ["A cuidar", "Algunos indicadores se alejan de la referencia en este momento. Repite la medición en reposo y cuida tus hábitos."];
  return { score, label, message, inRange, total: parts.length };
}

const finite = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const STRESS_HIGH = 5;
export const STRESS_VERY_HIGH = 9;

function describeStress(index: number | null): StressReading | null {
  if (index === null) return null;
  if (index >= STRESS_VERY_HIGH) return { label: "Carga muy elevada", context: "Tu cuerpo mostró una carga fisiológica marcada durante la medición. Si persiste, repite la medición en reposo y con buena luz." };
  if (index >= STRESS_HIGH) return { label: "Carga elevada", context: "Tu cuerpo mostró una carga fisiológica algo alta en este momento. Puede variar con el día, el sueño o la cafeína." };
  return { label: "Dentro de la referencia", context: "Tu carga fisiológica durante la medición estuvo dentro del rango de referencia." };
}

export function describeBiometrics(input: BiometricInput | null): BiometricReading | null {
  if (!input) return null;
  const values: BiometricValues = {
    heartRateBpm: finite(input.heartRateBpm),
    respiratoryRateBpm: finite(input.respiratoryRateBpm),
    hrvSdnnMs: finite(input.hrvSdnnMs),
    hrvLnrmssdMs: finite(input.hrvLnrmssdMs),
    stressIndex: finite(input.stressIndex),
    parasympatheticActivity: finite(input.parasympatheticActivity),
    hrSeries: Array.isArray(input.hrSeries) && input.hrSeries.length >= 3 ? input.hrSeries.filter((n) => Number.isFinite(n)) : null,
  };
  const stress = describeStress(values.stressIndex);
  const reading = {
    heartRate: classify(
      input.heartRateBpm, HR,
      "El rango típico en reposo es de 60 a 100 latidos por minuto.",
      "Puede variar con el movimiento reciente, la cafeína o los nervios del momento.",
      "Es común en personas activas; si notas mareo o cansancio, coméntalo con un profesional.",
    ),
    respiratoryRate: classify(
      input.respiratoryRateBpm, RR,
      "El rango típico en reposo es de 12 a 20 respiraciones por minuto.",
      "Puede relacionarse con la tensión del día a día.",
      "Una respiración pausada suele acompañar estados de calma.",
    ),
  };
  return reading.heartRate || reading.respiratoryRate || stress || values.hrvSdnnMs !== null || values.parasympatheticActivity !== null ? { ...reading, stress, values, wellness: summarizeWellness(values) } : null;
}

// Único efecto en el motor: una respiración acelerada o un índice de estrés elevado (≥ 5 en la escala 0–10 de
// Shen.AI) suman +1 al eje de estrés (tope 3, una sola vez aunque ocurran ambos). La frecuencia cardiaca y la VFC
// no se usan para puntuar.
export function respiratoryStressBoost(input: BiometricInput | null): number {
  return respiratoryElevated(input) || stressElevated(input) ? 1 : 0;
}

export function respiratoryElevated(input: BiometricInput | null): boolean {
  const rr = input?.respiratoryRateBpm;
  return rr != null && Number.isFinite(rr) && rr > RR.high;
}

export function stressElevated(input: BiometricInput | null): boolean {
  const st = input?.stressIndex;
  return st != null && Number.isFinite(st) && st >= STRESS_HIGH;
}
