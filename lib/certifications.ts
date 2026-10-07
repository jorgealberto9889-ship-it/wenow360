// Sellos de calidad del laboratorio donde se fabrican los suplementos (catálogo de WeNow, pág. 2). No se
// afirma que una autoridad haya certificado un producto en particular ni se inventan folios. PENDIENTE: si
// WeNow entrega las constancias (organismo, folio, vigencia), añadirlas aquí.
export type Certification = {
  id: "gmp" | "non-gmo" | "gluten-free" | "kosher" | "cofepris";
  name: string;
  label: string;
  meaning: string;
  image: string;
};

export const CERTIFICATIONS: Certification[] = [
  {
    id: "gmp",
    name: "GMP Certified",
    label: "Buenas Prácticas de Manufactura",
    meaning: "GMP (Good Manufacturing Practice) son las buenas prácticas de manufactura: controles de higiene, trazabilidad y calidad en cada lote que se fabrica.",
    image: "/assets/seals/gmp.png",
  },
  {
    id: "non-gmo",
    name: "Non GMO",
    label: "Sin organismos genéticamente modificados",
    meaning: "Indica que los ingredientes no provienen de organismos genéticamente modificados.",
    image: "/assets/seals/non-gmo.png",
  },
  {
    id: "gluten-free",
    name: "Gluten Free",
    label: "Libre de gluten",
    meaning: "Sello que indica que el producto se elabora sin gluten.",
    image: "/assets/seals/gluten-free.png",
  },
  {
    id: "kosher",
    name: "Certified Kosher",
    label: "Cumple las normas kosher",
    meaning: "Certificación que verifica que ingredientes y proceso cumplen las normas alimentarias kosher.",
    image: "/assets/seals/kosher.png",
  },
  {
    id: "cofepris",
    name: "COFEPRIS",
    label: "Cumplimiento sanitario",
    meaning: "COFEPRIS es la autoridad sanitaria de México.",
    image: "/assets/seals/cofepris.png",
  },
];

export const QUALITY_TITLE = "Fabricados bajo los más altos estándares de calidad";
export const QUALITY_INTRO =
  "Los suplementos WeNow se elaboran en un laboratorio que cuenta con estos respaldos.";

// Bloque para el prompt de Winnie.
export function certificationsText() {
  return [
    `El laboratorio donde se fabrican los suplementos WeNow cuenta con estos respaldos de calidad: ${CERTIFICATIONS.map((c) => c.name).join(", ")}.`,
    ...CERTIFICATIONS.map((c) => `- ${c.name} (${c.label}): ${c.meaning}`),
    "Cómo hablar de ellos: preséntalos como respaldos del laboratorio de fabricación. No digas que COFEPRIS «aprobó» o «certificó» un producto ni su eficacia, no inventes números de folio, organismos ni fechas, y no asegures que cada producto cumple todos los sellos (por ejemplo, para alergias o dietas, remite a la etiqueta del producto). Si piden constancias o documentos, di que su asesor puede compartirle la documentación.",
  ].join("\n");
}
