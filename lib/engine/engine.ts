import { BRAND } from "../brand";
import { GOAL_LABELS, type Answers, type GoalId, type MetricId } from "./answers";
import { describeBiometrics, respiratoryStressBoost, type BiometricInput, type BiometricReading } from "./biometrics";

// Motor de recomendación de WeNow 360. Mecanismo heredado de WeNow 360 V2 (puntaje por objetivo y por
// métrica, exclusiones de seguridad, pares incompatibles, kit de 3–4 productos) con el catálogo de
// WeNow (scripts/data/wenow-catalog.ts). Los pesos son una propuesta inicial a validar con WeNow.
export const ENGINE_VERSION = "wenow-1.0";

export type EngineProduct = {
  id: string;
  type: "suplemento" | "accesorio";
  active: boolean;
  goals: Record<string, number>;
};

export type PriorityLabel = "esencial" | "prioritaria" | "complementaria";

export type Recommendation = {
  productId: string;
  relevanceScore: number;
  priorityLabel: PriorityLabel;
  reasonCodes: string[];
};

export type WellnessArea = { metric: MetricId | null; title: string; detail: string; score: number };
export type Habit = { title: string; detail: string; benefit: string };
export type MedicalAttention = { title: string; detail: string; critical?: boolean };

export type EngineResult = {
  engineVersion: string;
  stopped: boolean;
  headline: string;
  explanation: string;
  areas: WellnessArea[];
  analysisSummary: string[];
  medicalAttention: MedicalAttention | null;
  reviewNotes: string[];
  habits: Habit[];
  biometric: BiometricReading | null;
  recommendations: Recommendation[];
};

const PRIMARY_GOAL_WEIGHT = 3.8;
const SECONDARY_GOAL_WEIGHT = 1.25;

// Aporte de cada métrica de severidad (0–3) a cada producto. Los objetivos que eligen los
// productos de género (collagen-woman / collagen-man) y los de nicho entran por `goals` del catálogo.
const METRIC_PRODUCT_WEIGHTS: Record<MetricId, Record<string, number>> = {
  energy: { synergy: 2.8, "active-burn": 2.4, regenerex: 2.2, resnad: 1.6, antiox: 0.8, "collagen-man": 0.6 },
  focus: { "neuro-chai": 3, synergy: 2.2, "active-burn": 1.6, regenerex: 0.8 },
  stress: { "nk-plus": 3, "neuro-chai": 2.4, endo: 2.2 },
  sleep: { "nk-plus": 3.2, "neuro-chai": 2, endo: 1.8 },
  muscle: { "nutriday-red": 2.4, "nutriday-brown": 2.4, regenerex: 2.4, "collagen-man": 1.2, endo: 1 },
  mobility: { regenerex: 2.4, "collagen-woman": 1.6, "collagen-man": 1.6 },
  digestion: { "green-plus": 3, purebody: 2.6, "nutriday-red": 0.8, "nutriday-brown": 0.8 },
  weight: { purebody: 4, "active-burn": 2.4, "green-plus": 1.6, synergy: 1.6, "nutriday-red": 0.8, "nutriday-brown": 0.8 },
};

// Un solo producto por grupo: misma proteína con distinto sabor, un colágeno por persona y
// una sola fuente de café/estimulante a la vez.
const INCOMPATIBLE_PAIRS: [string, string][] = [
  ["nutriday-red", "nutriday-brown"],
  ["collagen-woman", "collagen-man"],
  ["active-burn", "regenerex"],
  ["active-burn", "synergy"],
  ["regenerex", "synergy"],
];

const AREA_COPY: Record<MetricId, { title: string; detail: string }> = {
  energy: { title: "Energía cotidiana", detail: "Rutinas que ayuden a sostener vitalidad durante el día." },
  focus: { title: "Enfoque y claridad", detail: "Hábitos que favorezcan atención y rendimiento mental." },
  stress: { title: "Manejo de tensión", detail: "Espacios de recuperación, pausa y relajación consciente." },
  sleep: { title: "Descanso", detail: "Regularidad y calidad percibida de tu rutina de sueño." },
  muscle: { title: "Recuperación física", detail: "Movimiento, descanso y cuidado de la función muscular." },
  mobility: { title: "Movilidad", detail: "Flexibilidad y comodidad en el movimiento cotidiano." },
  digestion: { title: "Bienestar digestivo", detail: "Alimentación, hidratación y regularidad cotidiana." },
  weight: { title: "Hábitos metabólicos", detail: "Acciones sostenibles relacionadas con apetito y peso." },
};

function selectedGoalSet(a: Answers) {
  return new Set<GoalId>([a.primaryGoal, ...a.secondaryGoals]);
}

export function buildHabits(a: Answers): Habit[] {
  const habits: Habit[] = [];
  const bmi = a.heightCm && a.weightKg ? a.weightKg / (a.heightCm / 100) ** 2 : null;
  const nutritionReview = bmi !== null && (bmi < 18.5 || bmi >= 30);

  habits.push(
    a.sleepHours === "under-5" || a.sleepHours === "5-6"
      ? {
          title: "Regálate al menos 7 horas de sueño",
          detail: "Intenta acostarte y levantarte a la misma hora, incluso el fin de semana. Si te sigue costando dormir, coméntalo con un profesional.",
          benefit: "Dormir lo suficiente te ayuda a tener más energía, mejor ánimo y a que tu cuerpo se recupere.",
        }
      : {
          title: "Cuida tu rutina de sueño",
          detail: "Mantén tus horarios y aleja las pantallas, la cafeína y las cenas pesadas de la hora de dormir.",
          benefit: "Un sueño constante sostiene tu energía y tu concentración durante el día.",
        },
  );
  habits.push(
    a.activityLevel === "sedentary" || a.activityLevel === "light"
      ? {
          title: "Muévete un poco más cada día",
          detail: "Empieza con caminatas cortas y pausas activas; poco a poco, busca llegar a 150 minutos a la semana, a tu ritmo.",
          benefit: "El movimiento mejora tu energía, tu ánimo y tu descanso, y cuida tus articulaciones.",
        }
      : {
          title: "Sigue activo y suma fuerza",
          detail: "Combina actividad aeróbica con ejercicios de fuerza al menos dos días por semana, si no tienes alguna contraindicación.",
          benefit: "La fuerza protege tus músculos y articulaciones y te ayuda a mantenerte con energía.",
        },
  );
  if (a.produceServings === "never" || a.produceServings === "some-days") {
    habits.push({
      title: "Llena tu plato de alimentos completos",
      detail: "Suma verduras, frutas, leguminosas, granos integrales y nueces; reduce las bebidas azucaradas y los alimentos muy salados.",
      benefit: "Tu cuerpo recibe más fibra, vitaminas y minerales, y eso se nota en tu digestión y tu energía.",
    });
  } else {
    habits.push(
      nutritionReview
        ? {
            title: "Busca orientación nutricional personalizada",
            detail: "Tus datos corporales los usamos solo como contexto general; un profesional puede ayudarte a definir metas a tu medida.",
            benefit: "Un plan hecho para ti es más fácil de sostener y más seguro.",
          }
        : {
            title: "Mantén tu alimentación variada",
            detail: "Sigue combinando verduras, frutas, leguminosas, granos integrales y proteínas de acuerdo con lo que necesitas.",
            benefit: "La variedad ayuda a que tu cuerpo reciba todo lo que necesita.",
          },
    );
  }
  habits.push(
    a.waterGlasses === "under-1l" || a.waterGlasses === "1-1.5l"
      ? {
          title: "Toma más agua a lo largo del día",
          detail: "Ten un vaso o una botella a la mano y ve aumentando poco a poco, según el clima y tu actividad.",
          benefit: "Una buena hidratación apoya tu energía, tu digestión y tu concentración.",
        }
      : {
          title: "Sigue hidratándote bien",
          detail: "Toma agua simple a lo largo del día y ajusta la cantidad según el clima y tu actividad.",
          benefit: "Mantenerte hidratado te ayuda a sentirte con energía y concentrado.",
        },
  );
  if (a.tobacco === "current") {
    habits.push({
      title: "Busca apoyo para dejar el tabaco",
      detail: "Reducirlo y dejarlo es de las decisiones con más impacto en tu salud; un profesional puede acompañarte con un plan.",
      benefit: "Tu respiración, tu energía y tu salud en general se benefician.",
    });
  } else if (a.alcohol === "frequent") {
    habits.push({
      title: "Reduce el alcohol",
      detail: "Evita usarlo para dormir o relajarte y deja algunos días de la semana sin consumo.",
      benefit: "Tu descanso suele ser más reparador sin alcohol.",
    });
  }
  return habits.slice(0, 5);
}

export function buildAreas(a: Answers): WellnessArea[] {
  const ranked = (Object.entries(a.metrics) as [MetricId, number][])
    .filter(([, score]) => score >= 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3)
    .map(([metric, score]) => ({ metric, ...AREA_COPY[metric], score }));
  return ranked.length > 0
    ? ranked
    : [{ metric: null, title: "Bienestar integral", detail: "Un punto de partida para revisar hábitos y objetivos cotidianos.", score: 0 }];
}

export function buildAnalysisSummary(a: Answers, areas: WellnessArea[]): string[] {
  const goals = selectedGoalSet(a);
  const names = areas.map((x) => x.title.toLowerCase());
  const topAreas = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names.at(-1)}` : names[0];
  const paragraphs = [
    `Tu resultado sugiere concentrar tus primeros esfuerzos en ${topAreas}. Como tu objetivo principal es ${GOAL_LABELS[a.primaryGoal].toLowerCase()}, atender estas áreas de manera conjunta puede ayudarte a construir una rutina más equilibrada y sostenible.`,
  ];
  if (a.metrics.energy >= 2) {
    paragraphs.push("La frecuencia de cansancio que reportaste merece atención. Un descanso suficiente, horarios regulares de alimentación, movimiento cotidiano e hidratación constante suelen ser una base más útil que depender de soluciones rápidas para obtener energía.");
  }
  if (a.metrics.stress >= 2 || a.metrics.sleep >= 2) {
    paragraphs.push("La tensión y el descanso pueden influirse mutuamente. Conviene establecer una hora habitual para dormir, reducir estimulantes al final del día e incluir pausas breves de recuperación para favorecer un sueño más reparador.");
  }
  const water: Record<Answers["waterGlasses"], string> = {
    "under-1l": "Actualmente tomas menos de 1 litro de agua al día. Aumentar gradualmente el consumo de agua simple y distribuirlo durante la jornada puede favorecer tu energía, digestión y desempeño cotidiano.",
    "1-1.5l": "Actualmente tomas entre 1 y 1.5 litros de agua al día. Procura distribuirla mejor durante la jornada y ajustarla de acuerdo con tu actividad, el clima y cualquier indicación profesional.",
    "1.5-2l": "Tu consumo de agua se encuentra entre 1.5 y 2 litros al día. Mantén la regularidad y ajústalo según tu actividad física, el clima y cualquier indicación profesional.",
    "over-2l": "Tomas más de 2 litros de agua al día. Mantén una hidratación equilibrada y adaptada a tu actividad y estado de salud.",
  };
  paragraphs.push(water[a.waterGlasses]);
  if (goals.has("weight") || goals.has("detox") || a.metrics.weight >= 2) {
    paragraphs.push("Para avanzar hacia un peso saludable, conviene observar en conjunto el apetito, la calidad de los alimentos, la actividad física, el descanso y la hidratación. Los cambios graduales y sostenibles suelen ofrecer mejores resultados que las restricciones extremas.");
  }
  if (goals.has("detox") || a.metrics.digestion >= 2) {
    paragraphs.push("Para favorecer la regularidad digestiva y una sensación de ligereza, prioriza agua simple, alimentos con fibra, verduras, frutas y movimiento diario. Tu organismo ya cuenta con procesos naturales de eliminación; evita métodos de limpieza extrema o planes demasiado restrictivos.");
  }
  return paragraphs;
}

export function buildMedicalAttention(a: Answers): MedicalAttention | null {
  const c = new Set(a.conditions);
  const m = new Set(a.medications);
  if (a.pregnancy === "yes") {
    return { title: "Acompañamiento profesional antes de elegir", detail: "Durante el embarazo o la lactancia, revisa cualquier suplemento con el profesional que acompaña esta etapa.", critical: true };
  }
  if (c.has("cancer-treatment")) {
    return { title: "Consulta a tu equipo médico antes de elegir", detail: `Si existe cáncer activo o tratamiento oncológico, ${BRAND.name} no muestra suplementos automáticos para evitar interferencias con tu atención.`, critical: true };
  }
  if (c.has("heart") || c.has("kidney") || c.has("liver") || c.has("eating-risk") || m.has("anticoagulant") || m.has("immunosuppressant") || m.has("surgery")) {
    return { title: "Coordina esta orientación con tu profesional", detail: "Por una de tus respuestas, conviene integrar estas sugerencias con el seguimiento que ya recibes y revisar posibles interacciones." };
  }
  if (c.has("diabetes") || c.has("prediabetes") || m.has("antidiabetic") || m.has("antihypertensive") || m.has("thyroid")) {
    return { title: "Integra estas sugerencias a tu seguimiento", detail: "Si utilizas medicamentos de forma regular, comparte estas opciones con el profesional que da seguimiento a tu bienestar." };
  }
  return null;
}

export function calculateResult(a: Answers, catalog: EngineProduct[], biometricInput: BiometricInput | null = null): EngineResult {
  const habits = buildHabits(a);
  const areas = buildAreas(a);
  const analysisSummary = buildAnalysisSummary(a, areas);
  const medicalAttention = buildMedicalAttention(a);
  const biometric = describeBiometrics(biometricInput);
  const base = { engineVersion: ENGINE_VERSION, areas, analysisSummary, medicalAttention, habits, biometric };

  const stop = (headline: string, explanation: string, reviewNotes: string[] = []): EngineResult => ({
    ...base, stopped: true, headline, explanation, reviewNotes, recommendations: [],
  });
  if (a.age < 18) {
    return stop(`${BRAND.name} está disponible únicamente para mayores de 18 años`, "No generaremos recomendaciones para personas menores de edad.");
  }
  if (a.pregnancy === "yes") {
    return stop("Tu perfil requiere orientación profesional", "Durante el embarazo o la lactancia no generamos recomendaciones automáticas de suplementos.", ["Consulta con tu profesional de salud antes de utilizar cualquier suplemento."]);
  }
  if (a.conditions.includes("cancer-treatment")) {
    return stop("Tu perfil requiere orientación profesional", `Cuando existe cáncer activo o tratamiento oncológico, ${BRAND.name} no genera recomendaciones automáticas de suplementos.`, ["Consulta cualquier suplemento con tu equipo médico antes de utilizarlo."]);
  }

  const products = catalog.filter((p) => p.active);
  const known = new Set(products.map((p) => p.id));
  const scores = new Map<string, number>(products.map((p) => [p.id, 0]));
  const reasons = new Map<string, Set<string>>(products.map((p) => [p.id, new Set()]));
  const add = (id: string, amount: number, code: string) => {
    if (!known.has(id) || amount <= 0) return;
    scores.set(id, scores.get(id)! + amount);
    reasons.get(id)!.add(code);
  };

  const addGoal = (goal: GoalId, multiplier: number, code: string) => {
    for (const p of products) add(p.id, (p.goals[goal] ?? 0) * multiplier, `${code}:${goal}`);
  };
  addGoal(a.primaryGoal, PRIMARY_GOAL_WEIGHT, "goal_primary");
  a.secondaryGoals.forEach((g) => addGoal(g, SECONDARY_GOAL_WEIGHT, "goal_secondary"));

  // Impulsos de los dos productos-eje de peso y depuración.
  if (a.primaryGoal === "weight") add("purebody", 16, "boost:purebody_weight");
  if (a.primaryGoal === "detox") {
    add("green-plus", 18, "boost:green_plus_detox");
    add("purebody", 6, "boost:purebody_detox");
  }
  if (a.secondaryGoals.includes("weight")) add("purebody", 6, "boost:purebody_weight");
  if (a.secondaryGoals.includes("detox")) add("green-plus", 6, "boost:green_plus_detox");
  if (a.metrics.weight >= 2) add("purebody", 5, "boost:purebody_weight_metric");
  if (a.metrics.digestion >= 2) {
    add("green-plus", 4, "boost:green_plus_digestion_metric");
    add("purebody", 3, "boost:purebody_digestion_metric");
  }

  const stressBoost = respiratoryStressBoost(biometricInput);
  for (const [metric, reported] of Object.entries(a.metrics) as [MetricId, number][]) {
    const value = metric === "stress" ? Math.min(3, reported + stressBoost) : reported;
    if (value <= 0) continue;
    for (const [id, weight] of Object.entries(METRIC_PRODUCT_WEIGHTS[metric])) {
      add(id, value * weight, `metric:${metric}`);
      if (metric === "stress" && value > reported) reasons.get(id)?.add("biometric:respiratory_elevated");
    }
  }

  const excluded = new Set<string>();
  const exclude = (...ids: string[]) => ids.forEach((id) => excluded.add(id));
  const reviewNotes: string[] = [];
  const dietary = new Set(a.dietary);
  const c = new Set(a.conditions);
  const m = new Set(a.medications);
  const goals = selectedGoalSet(a);
  const metabolicProfile = c.has("diabetes") || c.has("prediabetes") || c.has("high-glucose") || m.has("antidiabetic");

  // Productos de género: se ofrecen a quien lo eligió como objetivo o a quien lo indicó en su perfil.
  if (a.biologicalSex === "male" && !goals.has("female")) exclude("collagen-woman");
  if (a.biologicalSex === "female" && !goals.has("male")) exclude("collagen-man");

  // Dieta y alergias (ingredientes del catálogo).
  const MILK = ["nutriday-red", "nutriday-brown", "transfactor"];
  const ANIMAL_COLLAGEN = ["collagen-woman", "collagen-man", "regenerex"];
  if (dietary.has("vegan")) exclude(...MILK, ...ANIMAL_COLLAGEN);
  if (dietary.has("milk-egg")) exclude(...MILK);
  if (dietary.has("chicken")) exclude(...ANIMAL_COLLAGEN);
  if (dietary.has("soy")) exclude("collagen-woman");
  if (dietary.has("nuts")) exclude("nutriday-brown");
  if (dietary.has("gluten")) exclude("nutriday-red", "nutriday-brown");

  // Cafeína: café, guaraná y té verde.
  const CAFFEINE = ["active-burn", "regenerex", "synergy", "nk-plus"];
  if (a.caffeineSensitive === "yes") exclude(...CAFFEINE);
  if (a.swallowing === "yes") exclude("purebody", "nk-plus", "transfactor", "resnad");

  if (c.has("hypertension") || c.has("heart")) exclude("active-burn", "synergy");
  if (c.has("heart")) exclude("regenerex");
  if (c.has("kidney")) exclude("green-plus", "antiox", "nutriday-red", "nutriday-brown", "purebody");
  if (c.has("liver")) exclude("green-plus", "antiox", "regenerex", "resnad", "collagen-man", "endo");
  if (c.has("autoimmune") || m.has("immunosuppressant")) exclude("transfactor");
  if (c.has("gastrointestinal")) exclude("purebody");
  if (c.has("eating-risk")) {
    exclude("purebody", "active-burn", "synergy", "green-plus");
    reviewNotes.push(`${BRAND.name} no genera recomendaciones para pérdida extrema de peso o antecedentes de conducta alimentaria de riesgo.`);
  }
  if (m.has("anticoagulant")) exclude("green-plus", "nutriday-red", "nutriday-brown", "antiox", "regenerex", "resnad", "collagen-man", "synergy", "endo");
  if (m.has("surgery")) exclude("regenerex", "resnad", "nk-plus", "synergy", "neuro-chai", "endo");
  if (m.has("hormonal")) exclude("collagen-woman");
  // El extracto de cáñamo puede interactuar con medicamentos de uso regular.
  if (a.medications.length > 0) exclude("endo");

  if (metabolicProfile) {
    reviewNotes.push("Si utilizas insulina o medicamentos para la glucosa, integra cualquier suplemento a tu seguimiento habitual y consúltalo con tu profesional de salud.");
  }
  if (m.has("anticoagulant") || m.has("antihypertensive") || m.has("thyroid") || m.has("other")) {
    reviewNotes.push("Como utilizas medicamentos de forma regular, comparte esta selección durante tu seguimiento habitual para revisar cómo integrarla a tu rutina.");
  }
  if (a.conditionDetails || a.medicationDetails) {
    reviewNotes.push("La información adicional que compartiste puede ayudar a tu asesor o profesional a personalizar mejor la orientación.");
  }

  // Solo se recomienda lo que tiene afinidad real.
  const ranked = products
    .filter((p) => !excluded.has(p.id) && scores.get(p.id)! > 0)
    .map((p) => ({ product: p, score: scores.get(p.id)! }))
    .sort((x, y) => y.score - x.score);

  const topScore = ranked[0]?.score ?? 0;
  const fourthScore = ranked[3]?.score ?? 0;
  const target = ranked.length >= 4 && (topScore >= 24 || fourthScore >= Math.max(6, topScore * 0.34)) ? 4 : Math.min(3, ranked.length);

  const selected: typeof ranked = [];
  const conflicts = (id: string) =>
    selected.some((s) => INCOMPATIBLE_PAIRS.some(([x, y]) => (x === s.product.id && y === id) || (y === s.product.id && x === id)));
  for (const r of ranked) {
    if (selected.length >= target) break;
    if (conflicts(r.product.id)) continue;
    selected.push(r);
  }

  const labels: PriorityLabel[] = ["esencial", "prioritaria", "complementaria", "complementaria"];
  const recommendations = selected.map((s, i) => ({
    productId: s.product.id,
    relevanceScore: Math.round(s.score * 100) / 100,
    priorityLabel: labels[i],
    reasonCodes: [...reasons.get(s.product.id)!].sort(),
  }));

  return {
    ...base,
    stopped: false,
    headline: recommendations.length > 0 ? "Tu evaluación personalizada está lista" : "Tu evaluación sugiere una orientación más individual",
    explanation:
      recommendations.length > 0
        ? "Con base en tus respuestas identificamos las áreas que hoy merecen mayor atención y preparamos una orientación práctica para ti."
        : "Tus respuestas requieren una revisión cuidadosa. Primero encontrarás hábitos y áreas de oportunidad; no mostraremos productos cuando no exista una opción adecuada.",
    reviewNotes,
    recommendations,
  };
}
