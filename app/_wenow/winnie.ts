// Textos fijos del asistente compartidos por la pantalla y su voz: saludo y respuestas rápidas (sin costo de IA).
import type { SubmitResult } from "@/lib/assessments";
import { BRAND } from "@/lib/brand";
import { memberDiscountPct } from "@/lib/labels";
import { firstName } from "./copy";

export const winnieGreeting = (name: string) => {
  const first = firstName(name);
  return `¡Hola${first ? `, ${first}` : ""}! Soy ${BRAND.assistantName}, el asistente virtual de ${BRAND.shortName}. Pregúntame lo que quieras sobre tus productos, sus ingredientes y cómo pueden apoyarte, o sobre el ${BRAND.club}.`;
};

// Preguntas frecuentes respondidas en el navegador, sin costo: no pasan por el modelo de IA.
export function quickAnswers(saved: SubmitResult, advisor: string): { q: string; a: string }[] {
  const products = saved.result.stopped ? [] : saved.products;
  const pub = products.reduce((s, p) => s + p.publicPrice, 0);
  const member = products.reduce((s, p) => s + p.distributorPrice, 0);
  const pct = memberDiscountPct(pub, member);
  return [
    { q: "¿Cómo hago mi compra?", a: `Toca «Comprar ahora» para ir a la tienda, o escríbele por WhatsApp a ${advisor}: queda registrado como tu asesor y te ayuda a confirmar tu kit y la forma de pago.` },
    { q: "¿Qué es el precio miembro?", a: `Es el precio de los integrantes del ${BRAND.club}${pct ? `: con tu kit te ahorras cerca de ${pct}% frente al precio público` : ""}. Los productos son exactamente los mismos. ${advisor} te explica cómo ser miembro.` },
    ...(products.length
      ? [{ q: "¿Cómo tomo mis productos?", a: products.map((p) => `${p.name}: ${p.usage}`).join("\n\n") + "\n\nSi tomas medicamentos, coméntalo antes con tu profesional de la salud." }]
      : []),
  ];
}
