import { z } from "zod";

export const GOAL_IDS = [
  "energy", "focus", "sleep", "stress", "muscle", "mobility", "digestion",
  "weight", "detox", "immune", "metabolic", "female", "male",
  // WeNow 360: belleza desde dentro y longevidad celular (Collagen, AntiOX, ResNAD).
  "skin", "longevity",
] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const METRIC_IDS = ["energy", "focus", "stress", "sleep", "muscle", "mobility", "digestion", "weight"] as const;
export type MetricId = (typeof METRIC_IDS)[number];

// Solo se preguntan si la persona eligió ese objetivo (BIOCHECK_QUESTIONNAIRE_V2.md §1.2).
export const CONDITIONAL_METRICS = ["focus", "muscle", "mobility"] as const satisfies readonly MetricId[];

export const GOAL_LABELS: Record<GoalId, string> = {
  energy: "Energía y vitalidad",
  focus: "Enfoque y claridad",
  sleep: "Descanso",
  stress: "Relajación",
  muscle: "Función muscular",
  mobility: "Movilidad articular",
  digestion: "Bienestar digestivo",
  weight: "Peso y apetito",
  detox: "Depuración y ligereza",
  immune: "Defensas y bienestar general",
  metabolic: "Bienestar metabólico",
  female: "Bienestar femenino",
  male: "Bienestar masculino",
  skin: "Belleza desde dentro",
  longevity: "Longevidad celular",
};

const severity = z.number().int().min(0).max(3);
const notAsked = z.literal(-1);
const withNone = <T extends [string, ...string[]]>(values: T) =>
  z
    .array(z.enum([...values, "none"]))
    .max(values.length + 1)
    .transform((list) => [...new Set(list)].filter((v) => v !== "none") as T[number][]);

export const answersSchema = z
  .object({
    age: z.number().int().min(1).max(120),
    biologicalSex: z.enum(["male", "female", "prefer-not"]),
    pregnancy: z.enum(["yes", "no", "not-applicable"]),
    heightCm: z.number().min(100).max(250).nullable(),
    heightCertainty: z.enum(["exact", "approximate"]).nullable(),
    weightKg: z.number().min(25).max(350).nullable(),
    weightCertainty: z.enum(["exact", "approximate"]).nullable(),

    primaryGoal: z.enum(GOAL_IDS),
    secondaryGoals: z.array(z.enum(GOAL_IDS)).max(2),

    metrics: z.object({
      energy: severity,
      stress: severity,
      sleep: severity,
      weight: severity,
      digestion: severity,
      focus: severity.or(notAsked),
      muscle: severity.or(notAsked),
      mobility: severity.or(notAsked),
    }),
    commitment: z.enum(["ready", "slow", "unsure"]),

    sleepHours: z.enum(["under-5", "5-6", "7-8", "over-8"]),
    waterGlasses: z.enum(["under-1l", "1-1.5l", "1.5-2l", "over-2l"]),
    produceServings: z.enum(["never", "some-days", "most-days", "daily"]),
    activityLevel: z.enum(["sedentary", "light", "moderate", "high"]),
    tobacco: z.enum(["never", "former", "current"]),
    alcohol: z.enum(["none", "occasional", "frequent"]),

    caffeineSensitive: z.enum(["yes", "no", "unsure"]),
    swallowing: z.enum(["yes", "no", "unsure"]),
    dietary: withNone(["vegan", "milk-egg", "chicken", "soy", "nuts", "gluten"]),
    medications: withNone([
      "antidiabetic", "anticoagulant", "antihypertensive", "thyroid",
      "immunosuppressant", "hormonal", "surgery", "other",
    ]),
    conditions: withNone([
      "diabetes", "prediabetes", "high-glucose", "hypertension", "heart", "kidney", "liver",
      "thyroid", "autoimmune", "gastrointestinal", "cancer-treatment", "eating-risk",
    ]),
    conditionDetails: z.string().trim().max(500).default(""),
    medicationDetails: z.string().trim().max(500).default(""),
  })
  .superRefine((a, ctx) => {
    if (a.secondaryGoals.includes(a.primaryGoal)) {
      ctx.addIssue({ code: "custom", path: ["secondaryGoals"], message: "Repite el objetivo principal" });
    }
    const goals = new Set<string>([a.primaryGoal, ...a.secondaryGoals]);
    for (const m of CONDITIONAL_METRICS) {
      const asked = goals.has(m);
      const value = a.metrics[m];
      if (asked && value === -1) {
        ctx.addIssue({ code: "custom", path: ["metrics", m], message: "Falta la severidad de un objetivo elegido" });
      }
      if (!asked && value !== -1) {
        ctx.addIssue({ code: "custom", path: ["metrics", m], message: "Severidad de un objetivo no elegido" });
      }
    }
    if (a.biologicalSex === "male" && a.pregnancy !== "not-applicable") {
      ctx.addIssue({ code: "custom", path: ["pregnancy"], message: "No aplica" });
    }
  });

export type Answers = z.output<typeof answersSchema>;
export type AnswersInput = z.input<typeof answersSchema>;
