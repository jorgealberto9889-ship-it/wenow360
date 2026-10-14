// Textos fijos del asistente compartidos por la pantalla y su voz: saludo y respuestas rápidas (sin costo de IA).
import type { SubmitResult } from "@/lib/assessments";
import { BRAND } from "@/lib/brand";
import { KIT_SIZE, KIT_TOTAL, SHIPPING_NOTE, kitOffer } from "@/lib/kit";
import { money } from "@/lib/labels";
import { firstName } from "./copy";

export const winnieGreeting = (name: string) => {
  const first = firstName(name);
  return `¡Hola${first ? `, ${first}` : ""}! Soy ${BRAND.assistantName}, el asistente virtual de ${BRAND.shortName}. Pregúntame lo que quieras sobre tus productos, sus ingredientes y cómo pueden apoyarte, o sobre el ${BRAND.club}.`;
};

// Preguntas frecuentes respondidas en el navegador, sin costo: no pasan por el modelo de IA.
export function quickAnswers(saved: SubmitResult, advisor: string): { q: string; a: string }[] {
  const products = saved.result.stopped ? [] : saved.products;
  const { pct } = kitOffer(products);
  return [
    { q: "¿Cómo hago mi compra?", a: `Toca «Comprar ahora» para ir a la tienda, o escríbele por WhatsApp a ${advisor}: queda registrado como tu asesor y te ayuda a confirmar tu kit y la forma de pago.` },
    { q: "¿Qué incluye el kit de inscripción?", a: `La membresía del ${BRAND.club} y ${KIT_SIZE} productos a elegir, por ${money(KIT_TOTAL)} (${SHIPPING_NOTE})${pct && products.length ? `; frente al precio público ahorras cerca de ${pct}%` : ""}. Los productos son exactamente los mismos. ${advisor} te ayuda a completarlo.` },
    ...(products.length
      ? [{ q: "¿Cómo tomo mis productos?", a: products.map((p) => `${p.name}: ${p.usage}`).join("\n\n") + "\n\nSi tomas medicamentos, coméntalo antes con tu profesional de la salud." }]
      : []),
  ];
}
