import "server-only";
import {
  AREAS_INTRO, areaReason, areaStatus, areaWhy, biometricInsights, bridgeText, introText, offerSpeech,
  PRIORITY_WORD, productContent, productTip, reasonText, recap,
} from "@/app/_wenow/copy";
import type { Draft } from "@/app/_wenow/questions";
import type { SubmitResult } from "./assessments";

const FIXED = ["recap", "areas", "biometric", "analysis", "habits", "bridge", "intro", "offer"] as const;
const ORDINALS = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto"];

export function isNarrationSection(section: string, saved: SubmitResult) {
  if ((FIXED as readonly string[]).includes(section)) return true;
  return section.startsWith("product-") && saved.products.some((p) => `product-${p.id}` === section);
}

// Guiones por sección, construidos con los mismos textos que muestra la pantalla (app/_wenow/copy.ts).
export function narrationParagraphs(section: string, saved: SubmitResult, draft: Draft, name: string, advisor: string): string[] {
  const { result, products } = saved;
  const hasProducts = !result.stopped && products.length > 0;

  if (section.startsWith("product-")) {
    const index = products.findIndex((p) => `product-${p.id}` === section);
    const p = products[index];
    if (!p) return [];
    const rec = result.recommendations.find((r) => r.productId === p.id);
    const tip = productTip(p.id, draft);
    const c = productContent(p);
    return [
      `${ORDINALS[index] ?? ""}: ${p.name}, ${rec ? PRIORITY_WORD[rec.priorityLabel] : "complementaria"}.`,
      reasonText(rec),
      `Cómo puede apoyarte: ${c.summary}`,
      ...(c.catalog.length
        ? ["Esto es lo que puede aportarte:", ...c.catalog.map((b) => `${b}.`)]
        : c.benefits.length ? ["Esto es lo que puede aportarte:", ...c.benefits.map((b) => `${b.title}. ${b.detail}`)] : []),
      ...(c.timeline.length ? [`Lo que podrías empezar a notar: ${c.timeline.slice(0, 2).map((t) => `${t.label.toLowerCase()}, ${t.text}`).join(" Y ")}`] : []),
      ...(tip ? [tip] : []),
    ].filter(Boolean);
  }

  switch (section) {
    case "recap": {
      const r = recap(draft, name);
      return [
        r.first ? `Hola, ${r.first}.` : "Hola.",
        `Nos dijiste que tu prioridad hoy es ${r.primary}${r.secondaryClause}. ${r.closing}`,
        `${r.notes}${r.outro}`,
        `${r.next} Toca «Ver lo que encontramos» para continuar.`,
      ];
    }
    case "areas":
      return [
        "Este es tu resumen de bienestar.",
        AREAS_INTRO,
        ...result.areas.map((a) => `${a.title}: ${areaStatus(a).toLowerCase()}. ${areaReason(a)} ${areaWhy(a)}`),
      ];
    case "biometric": {
      if (!result.biometric) return [];
      const { items, note } = biometricInsights(result.biometric, draft);
      return [
        "Ahora, tu lectura biométrica, a partir de tu escaneo. Es orientativa y no reemplaza un estudio clínico.",
        ...items.map((i) => `${i.label}: ${i.reading.toLowerCase()}. ${i.what} ${i.context}`),
        ...(note ? [note] : []),
      ];
    }
    case "analysis":
      return ["¿Qué significa tu resultado?", ...result.analysisSummary];
    case "habits":
      return [
        "Estos son tus hábitos sugeridos: pocas acciones, concretas, que puedes empezar esta semana.",
        ...result.habits.map((h, i) => `${ORDINALS[i] ?? ""}: ${h.title}. ${h.detail} ${h.benefit}`),
      ];
    case "bridge": {
      if (!hasProducts) return [];
      const b = bridgeText(result.areas);
      return [b.title.replace("…", ","), b.body, `Toca «${b.cta}» para conocerla.`];
    }
    case "intro":
      return hasProducts ? [introText(result.areas, name)] : [result.headline, result.explanation];
    case "offer":
      return hasProducts ? offerSpeech(products, advisor) : [];
  }
  return [];
}
