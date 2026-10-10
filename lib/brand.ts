// Única fuente de la identidad de WeNow 360. Todo texto de marca, razón social, dominio y
// reglas comerciales visibles al usuario debe leerse de aquí, no escribirse en los componentes.
// Los valores marcados PENDIENTE los confirma WeNow.
export const BRAND = {
  name: "WeNow 360",
  shortName: "WeNow",
  club: "Club WeNow",
  productLine: "NutriDay Plus",
  tagline: "Un gran estilo de vida comienza ahora. Vívelo con WeNow.",
  motto: "Bienestar respaldado por ciencia",
  website: "https://wenow.global",
  // Asistente virtual con IA.
  assistantName: "Winnie",
  // PENDIENTE: razón social, domicilio y correos legales de WeNow.
  legalName: "WeNow",
  legalAddress: "Leibnitz #20, PH 1, Col. Anzures, Ciudad de México, C.P. 11590",
  // Teléfono corporativo TEMPORAL (WhatsApp, formato wa.me: 52 + 10 dígitos).
  corporatePhone: "+52 55 6397 0355",
  corporateWhatsapp: "525563970355",
  // Alias de Hostinger que reenvía al equipo de WeNow (crearlo antes de publicar el aviso a clientes reales).
  privacyEmail: "privacidad@wenowglobal.com",
  // Remitente de los correos (Resend). Sobrescribible con RESEND_FROM_NAME.
  emailFromName: "WeNow 360",
  corporateSlug: "wenow",
  // Ejemplo de ahorro de la lista de precios MX 2026 (el mismo para casi todo el catálogo).
  memberExample: { publicPrice: 990, memberPrice: 760 },
  timeZone: "America/Mexico_City",
  locale: "es-MX",
  currency: "MXN",
  disclaimer:
    "Suplemento alimenticio. Este producto no es un medicamento. El consumo de este producto es responsabilidad de quien lo recomienda y de quien lo usa.",
} as const;
