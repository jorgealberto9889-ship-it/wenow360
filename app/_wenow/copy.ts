// Textos del resultado compartidos por la pantalla y la narración con voz: lo que se escucha
// es exactamente lo que se lee.
import type { Ficha } from "@/db/schema";
import type { ResultProduct } from "@/lib/assessments";
import { GOAL_LABELS, type GoalId, type MetricId } from "@/lib/engine/answers";
import type { BiometricReading } from "@/lib/engine/biometrics";
import type { Recommendation, WellnessArea } from "@/lib/engine/engine";
import { BRAND } from "@/lib/brand";
import { AREA_STATUS, memberDiscountPct } from "@/lib/labels";
import { METRIC_COPY, type Draft } from "./questions";

export const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items.at(-1)}` : items[0] ?? "");

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

// ACTO 1

export function recap(draft: Draft, name: string) {
  const first = firstName(name);
  const primary = draft.primaryGoal ? GOAL_LABELS[draft.primaryGoal].toLowerCase() : "";
  const secondary = draft.secondaryGoals.map((g) => GOAL_LABELS[g].toLowerCase());

  const notes: string[] = [];
  if (draft.sleepHours === "under-5" || draft.sleepHours === "5-6") notes.push("duermes menos horas de las que tu cuerpo suele necesitar");
  const frequent = (Object.entries(draft.metrics) as [MetricId, number | null][])
    .filter(([m, v]) => m !== "weight" && (v ?? 0) >= 2)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 2)
    .map(([m]) => METRIC_COPY[m].title.toLowerCase());
  if (frequent.length) notes.push(`con frecuencia notas ${list(frequent)}`);
  if (draft.waterGlasses === "under-1l") notes.push("tomas menos de un litro de agua al día");

  return {
    heading: first ? `Hola, ${first} — esto nos compartiste` : "Esto nos compartiste",
    first,
    primary,
    secondaryClause: secondary.length > 0 ? `, y que ${list(secondary)} también ${secondary.length > 1 ? "te importan" : "te importa"}` : "",
    closing: "Contarnos esto ya es un paso — vamos a ordenarlo con calma.",
    notes: notes.length > 0 ? `Mencionaste que ${list(notes)}. ` : "",
    outro: "Con eso en mente armamos lo que sigue — no es una plantilla genérica, es a partir de lo que tú nos contaste.",
    next: "En la siguiente parte te muestro lo que encontramos en tus respuestas.",
  };
}

// ACTO 2

export const AREAS_INTRO =
  "Estas son las tres áreas que hoy más atención te piden, según lo que nos contaste. Entre más lleno está el anillo, más prioridad tiene esa área.";

const WHY_IT_MATTERS: Record<MetricId, string> = {
  energy: "Tu nivel de energía influye en tu ánimo, en tu concentración y en las ganas de moverte durante el día.",
  focus: "La claridad mental depende mucho del descanso, la hidratación y las pausas que te das durante el día.",
  stress: "Cuando la tensión se acumula, suele notarse en el sueño, la digestión y la energía.",
  sleep: "Dormir bien es la base de casi todo lo demás: tu energía, tu ánimo, tu apetito y tu recuperación.",
  muscle: "Unos músculos bien recuperados te permiten moverte con más comodidad y constancia.",
  mobility: "Moverte con comodidad te ayuda a mantenerte activo, y la actividad es de lo que más aporta a tu bienestar.",
  digestion: "Una digestión regular se nota en tu energía, tu comodidad y tu ánimo a lo largo del día.",
  weight: "Cuidar tu apetito y tu peso con hábitos sostenibles apoya tu energía y tu bienestar a largo plazo.",
};

const FREQUENCY_PHRASE = ["casi nunca", "a veces", "seguido", "muy seguido"];
const IMPORTANCE_PHRASE = ["no es prioridad", "es algo importante", "es bastante importante", "es muy importante"];

export function areaReason(area: WellnessArea) {
  if (!area.metric) return area.detail;
  const reported =
    area.metric === "weight"
      ? `para ti ${IMPORTANCE_PHRASE[area.score]} cuidar tu apetito o mantener un peso saludable`
      : `${FREQUENCY_PHRASE[area.score]} tienes ${METRIC_COPY[area.metric].title.toLowerCase()}`;
  return area.score === 0 ? `Nos dijiste que ${reported}. Sigue así; aquí no necesitas cambios grandes por ahora.` : `Nos dijiste que ${reported}.`;
}

export const areaWhy = (area: WellnessArea) => (area.metric ? WHY_IT_MATTERS[area.metric] : area.detail);
export const areaStatus = (area: WellnessArea) => AREA_STATUS[area.score];

export function biometricInsights(bio: BiometricReading, draft: Draft) {
  const items: { label: string; what: string; reading: string; context: string }[] = [];
  if (bio.heartRate) {
    items.push({
      label: "Pulso en reposo",
      what: "Cuántas veces late tu corazón por minuto mientras estás quiet@. Lo típico en reposo es entre 60 y 100.",
      reading: bio.heartRate.label,
      context: bio.heartRate.label === "Dentro de lo típico" ? "Tu pulso está en el rango típico para una persona en reposo." : bio.heartRate.context,
    });
  }
  if (bio.respiratoryRate) {
    const elevated = bio.respiratoryRate.label === "Ligeramente acelerada";
    const stressReported = (draft.metrics.stress ?? 0) >= 2;
    items.push({
      label: "Respiración",
      what: "Cuántas veces respiras por minuto en reposo. Lo típico es entre 12 y 20.",
      reading: bio.respiratoryRate.label,
      context:
        elevated && stressReported
          ? "Coincide con la tensión que nos contaste, y por eso la tomamos en cuenta en tus recomendaciones."
          : bio.respiratoryRate.context,
    });
  }
  const v = bio.values;
  if (v.hrvSdnnMs !== null) {
    items.push({
      label: "Variabilidad cardiaca",
      what: "Cuánto cambia el tiempo entre un latido y otro. No hay un valor ideal universal: sirve para compararte contigo, a la misma hora y en reposo.",
      reading: `${Math.round(v.hrvSdnnMs)} ms`,
      context: "Una variabilidad mayor suele acompañar un cuerpo que se adapta mejor al día a día.",
    });
  }
  if (bio.stress) {
    items.push({
      label: "Índice de estrés",
      what: "Una escala de 0 a 10 de la carga fisiológica de tu cuerpo durante la medición; no mide emociones ni tu estado mental.",
      reading: `${bio.stress.label}${v.stressIndex !== null ? ` · ${v.stressIndex.toFixed(1)} de 10` : ""}`,
      context: bio.stress.context,
    });
  }
  if (v.parasympatheticActivity !== null) {
    items.push({
      label: "Actividad parasimpática",
      what: "El porcentaje del control de tu pulso que corresponde a la rama de calma y recuperación de tu sistema nervioso.",
      reading: `${Math.round(v.parasympatheticActivity)} %`,
      context: "Un valor más alto indica más influencia de la rama de calma y recuperación.",
    });
  }
  const note = !bio.respiratoryRate ? "Tu respiración no se pudo leer con suficiente claridad esta vez, así que no la usamos." : null;
  return { items, note };
}

export function bridgeText(areas: WellnessArea[]) {
  const names = list(areas.filter((a) => a.metric).map((a) => a.title.toLowerCase()));
  return {
    title: "Tus hábitos son la base… y hay algo más",
    body: `Para darles un impulso, preparamos algo pensado solo para ti: una selección de productos que puede acompañar ${names || "tus objetivos"}. Vas a ver cómo encaja cada uno con lo que nos contaste.`,
    cta: "Descubrir mi plan personalizado",
  };
}

// ACTO 3

export function introText(areas: WellnessArea[], name: string) {
  const first = firstName(name);
  const names = list(areas.filter((a) => a.metric).map((a) => a.title.toLowerCase()));
  return `${first ? `${first}, preparamos` : "Preparamos"} una recomendación personalizada para ti. Elegimos estos productos, en orden de prioridad, pensando en ${names || "tus objetivos"}. Te cuento de cada uno por qué está aquí y cómo puede acompañarte.`;
}

const METRIC_REASON: Record<MetricId, string> = {
  energy: "el cansancio que reportaste",
  focus: "tu dificultad para concentrarte",
  stress: "la tensión que sientes en el día a día",
  sleep: "cómo está tu descanso",
  muscle: "la tensión muscular que mencionaste",
  mobility: "las molestias al moverte",
  digestion: "cómo está tu digestión",
  weight: "tu interés en cuidar tu apetito y tu peso",
};

export function reasonText(rec: Recommendation | undefined) {
  if (!rec) return "";
  const codes = rec.reasonCodes.map((c) => c.split(":") as [string, string]);
  const metrics = new Set(codes.filter(([k]) => k === "metric").map(([, v]) => v));
  const phrases: string[] = [];
  const add = (p: string | undefined) => p && !phrases.includes(p) && phrases.push(p);
  for (const [kind, value] of codes) if (kind === "goal_primary") add(`tu objetivo principal, ${GOAL_LABELS[value as GoalId]?.toLowerCase()}`);
  for (const [kind, value] of codes) if (kind === "metric") add(METRIC_REASON[value as MetricId]);
  for (const [kind, value] of codes) {
    // Si ya se citó la métrica del mismo tema, el objetivo secundario sería redundante.
    if (kind === "goal_secondary" && !metrics.has(value)) add(`tu interés en ${GOAL_LABELS[value as GoalId]?.toLowerCase()}`);
  }
  if (rec.reasonCodes.includes("boost:metabolic_profile")) add("tu perfil metabólico");
  if (rec.reasonCodes.includes("habit:hydration_low")) add("tu consumo de agua");
  if (rec.reasonCodes.includes("biometric:respiratory_elevated")) add("tu lectura de respiración");
  if (rec.reasonCodes.includes("biometric:stress_elevated")) add("tu índice de estrés en el escaneo");
  return phrases.length ? `Te lo recomendamos por ${list(phrases.slice(0, 3))}.` : "";
}

// Normaliza el contenido de beneficios (los resultados guardados antes de sep-2026 usaban solo textos).
export function productContent(p: ResultProduct) {
  const h = p.highlights as unknown as { ficha?: Ficha; summary?: string; catalogBenefits?: string[]; benefits?: (string | { title: string; detail: string })[]; timeline?: { label: string; text: string }[] } | null;
  return {
    ficha: h?.ficha ?? null,
    summary: h?.summary ?? p.ingredientSupport,
    // Beneficios textuales del catálogo de WeNow (su lenguaje de marca), sin el punto final.
    catalog: (h?.catalogBenefits ?? []).map((b) => b.replace(/\.$/, "")),
    benefits: (h?.benefits ?? []).map((b) => (typeof b === "string" ? { title: b, detail: "" } : b)),
    timeline: h?.timeline ?? [],
  };
}

const CAFFEINATED = new Set(["active-burn", "regenerex", "synergy"]);

export function productTip(productId: string, draft: Draft) {
  const sleepIssue = (draft.metrics.sleep ?? 0) >= 2 || draft.sleepHours === "under-5" || draft.sleepHours === "5-6";
  if (CAFFEINATED.has(productId) && sleepIssue) return "Como nos contaste que te cuesta descansar, tómalo por la mañana.";
  return null;
}

export const PRIORITY_WORD = { esencial: "esencial", prioritaria: "prioritaria", complementaria: "complementaria" } as const;

// Kit a precio miembro del Club WeNow: la diferencia entre el precio público y el precio miembro de cada producto.
export function offerNumbers(products: ResultProduct[]) {
  const pub = products.reduce((s, p) => s + p.publicPrice, 0);
  const pay = products.reduce((s, p) => s + p.distributorPrice, 0);
  return { pub, pay, savings: Math.max(0, pub - pay), pct: memberDiscountPct(pub, pay) };
}

export function offerSpeech(products: ResultProduct[], advisor: string) {
  const o = offerNumbers(products);
  return [
    "Ahora te cuento cómo llevártelo.",
    `A precio público, tu kit completo costaría ${o.pub} pesos.`,
    `Con tu precio de miembro del ${BRAND.club} te queda en ${o.pay} pesos: te ahorras ${o.savings} pesos, ${o.pct} por ciento menos, por exactamente los mismos productos.`,
    `Toca «Comprar ahora» para ir a la tienda, o escríbele por WhatsApp a ${advisor}, que queda registrado como tu asesor.`,
  ];
}
