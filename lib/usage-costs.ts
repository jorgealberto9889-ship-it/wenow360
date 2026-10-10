// Cálculo del costo mensual de operar WeNow 360 y del margen frente a la cuota del cliente. Función pura (sin base de
// datos) para poder probarla. Todas las tarifas son ESTIMADAS y las edita el dueño en /admin/dueno: hay que
// verificarlas en las páginas de precios de cada proveedor.

export type FixedCost = { name: string; amount: number; currency: "USD" | "EUR" | "MXN" };

export type OwnerSettings = {
  feeMxn: number; // cuota mensual que paga el cliente (sin IVA)
  usdMxn: number;
  eurMxn: number;
  fixed: FixedCost[]; // Vercel, dominio, Turso, plan de Shen.AI…
  shen: { included: number; extraEur: number }; // escaneos incluidos en el plan y precio por escaneo extra (EUR)
  gemini: { inputUsdPerM: number; outputUsdPerM: number };
  tts: { usdPerMChars: number; freeChars: number };
  email: { freePerMonth: number; usdPerEmail: number };
  // Cobro anual al cliente por dominio y hosting: gratis los primeros años y después una renovación fija.
  annual: { name: string; amountMxn: number; startDate: string; freeYears: number };
};

export const DEFAULT_SETTINGS: OwnerSettings = {
  feeMxn: 0,
  usdMxn: 18.5,
  eurMxn: 21.5,
  fixed: [
    { name: "Plan de Shen.AI (500 escaneos)", amount: 500, currency: "EUR" },
    { name: "Vercel (alojamiento)", amount: 20, currency: "USD" },
    { name: "Turso (base de datos)", amount: 0, currency: "USD" },
    { name: "Dominio", amount: 0, currency: "MXN" },
  ],
  shen: { included: 500, extraEur: 0.2 },
  gemini: { inputUsdPerM: 0.1, outputUsdPerM: 0.4 },
  tts: { usdPerMChars: 16, freeChars: 1_000_000 },
  email: { freePerMonth: 3000, usdPerEmail: 0.0004 },
  annual: { name: "Dominio y hosting", amountMxn: 1780, startDate: "2026-10-10", freeYears: 1 },
};

export type MonthUsage = {
  scans: number; emails: number; geminiIn: number; geminiOut: number; ttsChars: number; assessments: number; winnieQuestions: number;
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
    { service: "Escaneos extra de Shen.AI", usage: `${u.scans} escaneos · ${shenExtra} sobre el cupo`, costMxn: round2(shenExtra * s.shen.extraEur * s.eurMxn), note: `Cupo incluido: ${s.shen.included}` },
    { service: "Winnie (Gemini)", usage: `${u.geminiIn.toLocaleString("es-MX")} tokens de entrada · ${u.geminiOut.toLocaleString("es-MX")} de salida`, costMxn: round2(gemini * s.usdMxn) },
    { service: "Voz del resultado (Google TTS)", usage: `${u.ttsChars.toLocaleString("es-MX")} caracteres`, costMxn: round2(tts * s.usdMxn), note: `Gratis hasta ${s.tts.freeChars.toLocaleString("es-MX")}` },
    { service: "Correos (Resend)", usage: `${u.emails.toLocaleString("es-MX")} enviados`, costMxn: round2(emailsBilled * s.email.usdPerEmail * s.usdMxn), note: `Gratis hasta ${s.email.freePerMonth.toLocaleString("es-MX")}` },
  ];

  const fixedMxn = round2(fixedLines.reduce((a, l) => a + l.costMxn, 0));
  const variableMxn = round2(variableLines.reduce((a, l) => a + l.costMxn, 0));
  const totalMxn = round2(fixedMxn + variableMxn);
  const annualMonthlyMxn = new Date(monthStart) >= renewalDate(s.annual) ? round2(s.annual.amountMxn / 12) : 0;
  const revenueMxn = round2(s.feeMxn + annualMonthlyMxn);
  const marginMxn = round2(revenueMxn - totalMxn);
  return {
    fixedLines, variableLines, fixedMxn, variableMxn, totalMxn, feeMxn: s.feeMxn, annualMonthlyMxn, revenueMxn, marginMxn,
    marginPct: revenueMxn > 0 ? Math.round((marginMxn / revenueMxn) * 1000) / 10 : null,
    shenQuotaUsedPct: s.shen.included > 0 ? Math.round((u.scans / s.shen.included) * 100) : 0,
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
    fixed: saved?.fixed?.length ? saved.fixed : d.fixed,
  };
}
