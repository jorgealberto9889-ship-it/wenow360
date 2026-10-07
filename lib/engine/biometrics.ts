export type BiometricInput = {
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
};

export type QualitativeReading = {
  label: "Dentro de lo típico" | "Ligeramente acelerada" | "Más pausada de lo típico";
  context: string;
};

export type BiometricReading = {
  heartRate: QualitativeReading | null;
  respiratoryRate: QualitativeReading | null;
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

export function describeBiometrics(input: BiometricInput | null): BiometricReading | null {
  if (!input) return null;
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
  return reading.heartRate || reading.respiratoryRate ? reading : null;
}

// Único efecto en el motor: una respiración acelerada suma +1 al eje de estrés (tope 3).
// La frecuencia cardiaca no se usa para puntuar (BIOCHECK_V2_AUDIT.md §6b).
export function respiratoryStressBoost(input: BiometricInput | null): number {
  const rr = input?.respiratoryRateBpm;
  return rr != null && Number.isFinite(rr) && rr > RR.high ? 1 : 0;
}
