import { CONDITIONAL_METRICS, type AnswersInput, type GoalId, type MetricId } from "@/lib/engine/answers";

export type Distributor = { slug: string; displayName: string; whatsapp: string };

type Opt<T extends string> = readonly (readonly [T, string])[];
const opts = <T extends string>(o: readonly (readonly [T, string])[]): Opt<T> => o;

export const PRIMARY_GOALS: { id: GoalId; icon: string; label: string; hint: string }[] = [
  { id: "energy", icon: "⚡", label: "Energía y vitalidad", hint: "Sentirme con más energía durante el día" },
  { id: "sleep", icon: "☾", label: "Descanso", hint: "Dormir mejor y despertar descansado" },
  { id: "stress", icon: "◍", label: "Manejo del estrés", hint: "Sentir más calma en el día a día" },
  { id: "focus", icon: "◎", label: "Enfoque y claridad", hint: "Concentración y rendimiento mental" },
  { id: "digestion", icon: "❁", label: "Bienestar digestivo", hint: "Regularidad y menos pesadez" },
  { id: "mobility", icon: "↻", label: "Movilidad articular", hint: "Flexibilidad y movimiento cotidiano" },
  { id: "weight", icon: "◐", label: "Peso y hábitos", hint: "Acompañar objetivos responsables" },
  { id: "metabolic", icon: "◇", label: "Bienestar metabólico", hint: "Hábitos y equilibrio metabólico" },
  { id: "muscle", icon: "✦", label: "Función muscular", hint: "Recuperación, calambres o tensión" },
  { id: "immune", icon: "⬡", label: "Defensas", hint: "Apoyar tu sistema inmune día a día" },
  { id: "skin", icon: "✧", label: "Belleza desde dentro", hint: "Piel, cabello y uñas" },
  { id: "longevity", icon: "∞", label: "Longevidad celular", hint: "Energía y cuidado de tus células" },
];

export const SECONDARY_GOALS: [GoalId, string][] = [
  ["energy", "Energía"], ["sleep", "Descanso"], ["stress", "Relajación"], ["focus", "Enfoque mental"],
  ["digestion", "Digestión"], ["mobility", "Movilidad"], ["muscle", "Función muscular"], ["weight", "Peso y apetito"],
  ["detox", "Depuración y ligereza"], ["immune", "Defensas"], ["metabolic", "Bienestar metabólico"],
  ["female", "Bienestar femenino"], ["male", "Bienestar masculino"], ["skin", "Belleza desde dentro"], ["longevity", "Longevidad celular"],
];

export const METRIC_COPY: Record<MetricId, { title: string; hint: string }> = {
  energy: { title: "Cansancio o falta de energía", hint: "Durante tus actividades cotidianas" },
  focus: { title: "Dificultad para concentrarte", hint: "Claridad mental y atención" },
  stress: { title: "Tensión o dificultad para relajarte", hint: "Sensación cotidiana de estrés" },
  sleep: { title: "Dificultad para dormir o descansar", hint: "Conciliar el sueño o despertar descansado" },
  muscle: { title: "Tensión muscular, calambres o recuperación lenta", hint: "Después de actividad física o durante el día" },
  mobility: { title: "Rigidez o molestias que limitan tu movilidad", hint: "Movimiento y flexibilidad articular" },
  digestion: { title: "Inflamación, pesadez o irregularidad digestiva", hint: "Percepción de bienestar digestivo" },
  weight: { title: "Importancia de controlar apetito o mantener un peso saludable", hint: "Desde hábitos responsables y sostenibles" },
};
export const FIXED_METRICS: MetricId[] = ["energy", "stress", "sleep", "digestion", "weight"];
export const FREQUENCY_WORDS = ["Nunca", "A veces", "Seguido", "Muy seguido"] as const;
export const IMPORTANCE_WORDS = ["Nada", "Poco", "Bastante", "Mucho"] as const;

export const SEX = opts([["female", "Femenino"], ["male", "Masculino"], ["prefer-not", "Prefiero no responder"]] as const);
export const PREGNANCY = opts([["no", "No"], ["yes", "Sí"], ["not-applicable", "No aplica"]] as const);
export const COMMITMENT: { id: AnswersInput["commitment"]; label: string; hint: string; icon: string }[] = [
  { id: "ready", icon: "➜", label: "List@ desde ya", hint: "Quiero empezar esta misma semana" },
  { id: "slow", icon: "◔", label: "Prefiero ir despacio", hint: "Un cambio a la vez, a mi ritmo" },
  { id: "unsure", icon: "?", label: "Aún no estoy segur@", hint: "Primero quiero entender mi resultado" },
];
export const SLEEP_HOURS = opts([["under-5", "Menos de 5"], ["5-6", "5–6"], ["7-8", "7–8"], ["over-8", "Más de 8"]] as const);
export const WATER = opts([["under-1l", "Menos de 1 L"], ["1-1.5l", "1 a 1.5 L"], ["1.5-2l", "1.5 a 2 L"], ["over-2l", "Más de 2 L"]] as const);
export const PRODUCE = opts([["never", "Nunca"], ["some-days", "Algunos días"], ["most-days", "Casi todos los días"], ["daily", "Todos los días"]] as const);
export const ACTIVITY: { id: AnswersInput["activityLevel"]; label: string; hint: string }[] = [
  { id: "sedentary", label: "Mayormente sedentario", hint: "Paso gran parte del día sentado" },
  { id: "light", label: "Actividad ligera", hint: "Caminatas o movimiento ocasional" },
  { id: "moderate", label: "Actividad moderada", hint: "Ejercicio de 2 a 4 días por semana" },
  { id: "high", label: "Actividad alta", hint: "Entrenamiento frecuente o trabajo físico" },
];
export const TOBACCO = opts([["never", "No"], ["former", "Antes, ya no"], ["current", "Sí, actualmente"]] as const);
export const ALCOHOL = opts([["none", "No consumo"], ["occasional", "Ocasionalmente"], ["frequent", "Varias veces por semana"]] as const);
export const YES_NO_UNSURE = opts([["no", "No"], ["yes", "Sí"], ["unsure", "No estoy segur@"]] as const);

export const DIETARY = opts([
  ["vegan", "Alimentación vegana"], ["milk-egg", "Alergia a leche o huevo"], ["chicken", "Alergia a pollo o colágeno"],
  ["soy", "Alergia a la soya"], ["nuts", "Alergia a nueces o avellana"], ["gluten", "Evito gluten"],
] as const);
export const MEDICATIONS = opts([
  ["antidiabetic", "Insulina o medicamentos para glucosa"], ["anticoagulant", "Anticoagulantes o antiagregantes"],
  ["antihypertensive", "Medicamentos para presión o corazón"], ["thyroid", "Medicamentos para tiroides"],
  ["immunosuppressant", "Inmunosupresores"], ["hormonal", "Tratamiento hormonal o de fertilidad"],
  ["surgery", "Cirugía programada próximamente"], ["other", "Otros medicamentos de uso regular"],
] as const);
export const CONDITIONS = opts([
  ["diabetes", "Diabetes diagnosticada"], ["prediabetes", "Prediabetes o resistencia a la insulina"],
  ["high-glucose", "Niveles de glucosa elevados"], ["hypertension", "Hipertensión diagnosticada"],
  ["heart", "Enfermedad cardiaca o arritmia"], ["kidney", "Enfermedad renal diagnosticada"],
  ["liver", "Enfermedad hepática diagnosticada"], ["thyroid", "Padecimiento de tiroides"],
  ["autoimmune", "Enfermedad autoinmune"], ["gastrointestinal", "Padecimiento gastrointestinal diagnosticado"],
  ["cancer-treatment", "Cáncer activo o tratamiento oncológico"], ["eating-risk", "Meta de peso extrema o antecedente alimentario de riesgo"],
] as const);

type Metrics = Record<MetricId, number | null>;
type Answer<K extends keyof AnswersInput> = AnswersInput[K] | null;

export type Draft = {
  name: string;
  age: string;
  biologicalSex: Answer<"biologicalSex">;
  pregnancy: Answer<"pregnancy">;
  heightCm: string;
  weightKg: string;
  skipBody: boolean;
  primaryGoal: GoalId | null;
  secondaryGoals: GoalId[];
  metrics: Metrics;
  commitment: Answer<"commitment">;
  sleepHours: Answer<"sleepHours">;
  waterGlasses: Answer<"waterGlasses">;
  produceServings: Answer<"produceServings">;
  activityLevel: Answer<"activityLevel">;
  tobacco: Answer<"tobacco">;
  alcohol: Answer<"alcohol">;
  caffeineSensitive: Answer<"caffeineSensitive">;
  swallowing: Answer<"swallowing">;
  dietary: string[] | null;
  medications: string[] | null;
  medicationDetails: string;
  conditions: string[] | null;
  conditionDetails: string;
};

export const EMPTY_DRAFT: Draft = {
  name: "",
  age: "", biologicalSex: null, pregnancy: null, heightCm: "", weightKg: "", skipBody: false,
  primaryGoal: null, secondaryGoals: [],
  metrics: { energy: null, focus: null, stress: null, sleep: null, muscle: null, mobility: null, digestion: null, weight: null },
  commitment: null, sleepHours: null, waterGlasses: null, produceServings: null, activityLevel: null, tobacco: null, alcohol: null,
  caffeineSensitive: null, swallowing: null, dietary: null, medications: null, medicationDetails: "", conditions: null, conditionDetails: "",
};

export function chosenGoals(d: Draft) {
  return new Set<GoalId>([...(d.primaryGoal ? [d.primaryGoal] : []), ...d.secondaryGoals]);
}

export function askedMetrics(d: Draft): MetricId[] {
  const goals = chosenGoals(d);
  return [...FIXED_METRICS, ...CONDITIONAL_METRICS.filter((m) => goals.has(m))];
}

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));

export function toAnswers(d: Draft): AnswersInput {
  const goals = chosenGoals(d);
  const metrics = Object.fromEntries(
    (Object.keys(d.metrics) as MetricId[]).map((m) => [
      m,
      (CONDITIONAL_METRICS as readonly MetricId[]).includes(m) && !goals.has(m) ? -1 : d.metrics[m] ?? 0,
    ]),
  ) as AnswersInput["metrics"];
  const body = !d.skipBody;
  return {
    age: Number(d.age),
    biologicalSex: d.biologicalSex!,
    pregnancy: d.biologicalSex === "male" ? "not-applicable" : d.pregnancy!,
    heightCm: body ? toNumber(d.heightCm) : null,
    heightCertainty: body && d.heightCm ? "approximate" : null,
    weightKg: body ? toNumber(d.weightKg) : null,
    weightCertainty: body && d.weightKg ? "approximate" : null,
    primaryGoal: d.primaryGoal!,
    secondaryGoals: d.secondaryGoals,
    metrics,
    commitment: d.commitment!,
    sleepHours: d.sleepHours!,
    waterGlasses: d.waterGlasses!,
    produceServings: d.produceServings!,
    activityLevel: d.activityLevel!,
    tobacco: d.tobacco!,
    alcohol: d.alcohol!,
    caffeineSensitive: d.caffeineSensitive!,
    swallowing: d.swallowing!,
    dietary: (d.dietary ?? []) as AnswersInput["dietary"],
    medications: (d.medications ?? []) as AnswersInput["medications"],
    conditions: (d.conditions ?? []) as AnswersInput["conditions"],
    medicationDetails: d.medicationDetails,
    conditionDetails: d.conditionDetails,
  };
}

// Reconstruye lo que el Acto 1 necesita a partir de las respuestas guardadas (enlace del correo).
export function draftFromAnswers(rows: { questionCode: string; value: unknown }[]): Draft {
  const a = Object.fromEntries(rows.map((r) => [r.questionCode, r.value])) as Record<string, unknown>;
  const metrics = (a.metrics ?? {}) as Record<MetricId, number>;
  return {
    ...EMPTY_DRAFT,
    primaryGoal: (a.primary_goal as GoalId) ?? null,
    secondaryGoals: (a.secondary_goals as GoalId[]) ?? [],
    metrics: Object.fromEntries(
      (Object.keys(EMPTY_DRAFT.metrics) as MetricId[]).map((m) => [m, typeof metrics[m] === "number" && metrics[m] >= 0 ? metrics[m] : null]),
    ) as Draft["metrics"],
    sleepHours: (a.sleep_hours as Draft["sleepHours"]) ?? null,
    waterGlasses: (a.water_glasses as Draft["waterGlasses"]) ?? null,
  };
}
