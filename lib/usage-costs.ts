// Cálculo del costo mensual de operar WeNow 360 y del margen frente a la cuota del cliente. Función pura (sin base de
// datos) para poder probarla. Todas las tarifas son ESTIMADAS y las edita el dueño en /admin/dueno: hay que
// verificarlas en las páginas de precios de cada proveedor.

export type FixedCost = { name: string; amount: number; currency: "USD" | "EUR" | "MXN" };

export type OwnerSettings = {
  feeMxn: number; // cuota mensual neta (sin IVA); se calcula desde plan.priceWithIva
  usdMxn: number;
  eurMxn: number;
  fixed: FixedCost[]; // Vercel, dominio, Turso, plan de Shen.AI…
  // Plan de Shen.AI: escaneos incluidos, precio por escaneo extra (EUR) y si lo paga el cliente desde su propia cuenta
  // (en ese caso no cuenta como costo de Órbita Digital).
  shen: { included: number; extraEur: number; paidByClient: boolean };
  gemini: { inputUsdPerM: number; outputUsdPerM: number };
  tts: { usdPerMChars: number; freeChars: number };
  email: { freePerMonth: number; usdPerEmail: number };
  // Cobro anual al cliente por dominio y hosting: gratis los primeros años y después una renovación fija.
  annual: { name: string; amountMxn: number; startDate: string; freeYears: number };
  // Plan que contrata el cliente: precio mensual con IVA y cupos incluidos.
  plan: { priceWithIva: number; ivaPct: number; scans: number; emails: number; conversations: number };
};

export const netFee = (p: OwnerSettings["plan"]) => Math.round((p.priceWithIva / (1 + p.ivaPct / 100)) * 100) / 100;

export const DEFAULT_SETTINGS: OwnerSettings = {
  feeMxn: 350,
  usdMxn: 18.5,
  eurMxn: 21.5,
  fixed: [
    { name: "Vercel (alojamiento)", amount: 20, currency: "USD" },
    { name: "Turso (base de datos)", amount: 0, currency: "USD" },
    { name: "Dominio", amount: 0, currency: "MXN" },
  ],
  shen: { included: 500, extraEur: 0.2, paidByClient: true },
  gemini: { inputUsdPerM: 0.1, outputUsdPerM: 0.4 },
  tts: { usdPerMChars: 16, freeChars: 1_000_000 },
  email: { freePerMonth: 3000, usdPerEmail: 0.0004 },
  annual: { name: "Dominio y hosting", amountMxn: 1780, startDate: "2026-10-10", freeYears: 1 },
  plan: { priceWithIva: 406, ivaPct: 16, scans: 1000, emails: 1500, conversations: 500 },
};

export type MonthUsage = {
  scans: number; emails: number; geminiIn: number; geminiOut: number; ttsChars: number; assessments: number; winnieQuestions: number;
  conversations: number; // conversaciones activas con Winnie (en el resultado + visitantes de la portada)
};

export type CostLine = { service: string; usage: string; costMxn: number; note?: string };

export type MonthCosts = {
  fixedLines: CostLine[];
  variableLines: CostLine[];
  fixedMxn: number;
  variableMxn: number;
  totalMxn: number;
  feeMxn: number;
  annualMonthlyMxn: number; // 1/12 de la renovación anual, solo cuando ya terminó el periodo gratis
  revenueMxn: number;
  marginMxn: number;
  marginPct: number | null; // null si no hay cuota registrada
  shenQuotaUsedPct: number;
  planUsage: { label: string; used: number; limit: number; pct: number }[];
  // Cuota mensual mínima (con IVA) para no perder dinero con todo el cupo del plan usado.
  breakEvenWithIva: number;
};

const toMxn = (amount: number, currency: FixedCost["currency"], s: OwnerSettings) =>
  currency === "USD" ? amount * s.usdMxn : currency === "EUR" ? amount * s.eurMxn : amount;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Fecha en que se cobra la primera renovación anual (inicio + años gratis).
export function renewalDate(a: OwnerSettings["annual"]) {
  const d = new Date(`${a.startDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + a.freeYears);
  return d;
}

export function computeMonthCosts(u: MonthUsage, s: OwnerSettings, monthStart: string = new Date().toISOString()): MonthCosts {
  const fixedLines = s.fixed.map((f) => ({
    service: f.name, usage: `${f.amount.toLocaleString("es-MX")} ${f.currency}/mes`, costMxn: round2(toMxn(f.amount, f.currency, s)),
  }));

  const shenExtra = Math.max(0, u.scans - s.shen.included);
  const gemini = (u.geminiIn / 1e6) * s.gemini.inputUsdPerM + (u.geminiOut / 1e6) * s.gemini.outputUsdPerM;
  const ttsBilled = Math.max(0, u.ttsChars - s.tts.freeChars);
  const tts = (ttsBilled / 1e6) * s.tts.usdPerMChars;
  const emailsBilled = Math.max(0, u.emails - s.email.freePerMonth);

  const variableLines: CostLine[] = [
    {
      service: "Escaneos de Shen.AI", usage: `${u.scans} escaneos · ${shenExtra} sobre el cupo de su plan`,
      costMxn: s.shen.paidByClient ? 0 : round2(shenExtra * s.shen.extraEur * s.eurMxn),
      note: s.shen.paidByClient ? "Lo paga el cliente en su cuenta de Shen.AI" : `Cupo incluido: ${s.shen.included}`,
    },
    { service: "Winnie (Gemini)", usage: `${u.geminiIn.toLocaleString("es-MX")} tokens de entrada · ${u.geminiOut.toLocaleString("es-MX")} de salida`, costMxn: round2(gemini * s.usdMxn) },
    { service: "Voz del resultado (Google TTS)", usage: `${u.ttsChars.toLocaleString("es-MX")} caracteres`, costMxn: round2(tts * s.usdMxn), note: `Gratis hasta ${s.tts.freeChars.toLocaleString("es-MX")}` },
    { service: "Correos (Resend)", usage: `${u.emails.toLocaleString("es-MX")} enviados`, costMxn: round2(emailsBilled * s.email.usdPerEmail * s.usdMxn), note: `Gratis hasta ${s.email.freePerMonth.toLocaleString("es-MX")}` },
  ];

  const fixedMxn = round2(fixedLines.reduce((a, l) => a + l.costMxn, 0));
  const variableMxn = round2(variableLines.reduce((a, l) => a + l.costMxn, 0));
  const totalMxn = round2(fixedMxn + variableMxn);
  const annualMonthlyMxn = new Date(monthStart) >= renewalDate(s.annual) ? round2(s.annual.amountMxn / 12) : 0;
  const feeMxn = netFee(s.plan);
  const revenueMxn = round2(feeMxn + annualMonthlyMxn);
  const marginMxn = round2(revenueMxn - totalMxn);
  return {
    fixedLines, variableLines, fixedMxn, variableMxn, totalMxn, feeMxn, annualMonthlyMxn, revenueMxn, marginMxn,
    marginPct: revenueMxn > 0 ? Math.round((marginMxn / revenueMxn) * 1000) / 10 : null,
    shenQuotaUsedPct: s.shen.included > 0 ? Math.round((u.scans / s.shen.included) * 100) : 0,
    planUsage: [
      { label: "Escaneos faciales", used: u.scans, limit: s.plan.scans },
      { label: "Correos automáticos", used: u.emails, limit: s.plan.emails },
      { label: "Conversaciones con IA", used: u.conversations, limit: s.plan.conversations },
    ].map((x) => ({ ...x, pct: x.limit > 0 ? Math.round((x.used / x.limit) * 100) : 0 })),
    breakEvenWithIva: Math.ceil(
      (fixedMxn + (s.shen.paidByClient ? 0 : Math.max(0, s.plan.scans - s.shen.included) * s.shen.extraEur * s.eurMxn)) * (1 + s.plan.ivaPct / 100),
    ),
  };
}

// Mezcla lo guardado con los valores por omisión (así, una tarifa nueva nunca deja un campo vacío).
export function mergeSettings(saved: Partial<OwnerSettings> | null): OwnerSettings {
  const d = DEFAULT_SETTINGS;
  return {
    ...d, ...saved,
    shen: { ...d.shen, ...saved?.shen },
    gemini: { ...d.gemini, ...saved?.gemini },
    tts: { ...d.tts, ...saved?.tts },
    email: { ...d.email, ...saved?.email },
    annual: { ...d.annual, ...saved?.annual },
    plan: { ...d.plan, ...saved?.plan },
    fixed: saved?.fixed?.length ? saved.fixed : d.fixed,
  };
}
