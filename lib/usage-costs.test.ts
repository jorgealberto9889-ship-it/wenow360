import assert from "node:assert/strict";
import test from "node:test";
import { computeMonthCosts, DEFAULT_SETTINGS, mergeSettings, renewalDate, type MonthUsage } from "./usage-costs";

const usage: MonthUsage = { scans: 520, emails: 3500, geminiIn: 2_000_000, geminiOut: 500_000, ttsChars: 1_500_000, assessments: 100, winnieQuestions: 300, conversations: 120, winnieResponses: 800 };

test("costos del mes: fijos, variables y margen contra la cuota", () => {
  const s = { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 29000 } };
  const c = computeMonthCosts(usage, s);
  // Vercel es un plan compartido de Órbita (sin costo para este proyecto) y Shen.AI lo paga el cliente
  assert.equal(c.fixedMxn, 0);
  assert.equal(c.variableLines[0].costMxn, 0);
  // Si Shen.AI fuera costo propio: 20 escaneos extra a 0,20 EUR
  const own = computeMonthCosts(usage, { ...s, shen: { ...s.shen, paidByClient: false } });
  assert.equal(own.variableLines[0].costMxn, 20 * 0.2 * 21.5);
  // Gemini: 2M*0.10 + 0.5M*0.40 = 0.40 USD; TTS: 0.5M*16/1M = 8 USD; correos: 500*0.0004 = 0.2 USD
  assert.equal(c.variableLines[1].costMxn, 0.4 * 18.5);
  assert.equal(c.variableLines[2].costMxn, 8 * 18.5);
  assert.equal(c.variableLines[3].costMxn, Math.round(0.2 * 18.5 * 100) / 100);
  assert.equal(c.totalMxn, Math.round((c.fixedMxn + c.variableMxn) * 100) / 100);
  assert.equal(c.feeMxn, 25000);
  assert.equal(c.marginMxn, Math.round((25000 - c.totalMxn) * 100) / 100);
  assert.ok((c.marginPct ?? 0) > 0);
  assert.equal(c.shenQuotaUsedPct, 104);
  assert.ok(c.marginMxn > 0);
});

test("renovación anual: gratis el primer año y luego 1/12 al mes de ingreso", () => {
  const s = { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 23200 } };
  const zero: MonthUsage = { scans: 0, emails: 0, geminiIn: 0, geminiOut: 0, ttsChars: 0, assessments: 0, winnieQuestions: 0, conversations: 0, winnieResponses: 0 };
  assert.equal(renewalDate(s.annual).toISOString().slice(0, 10), "2027-10-02");
  assert.equal(computeMonthCosts(zero, s, "2026-11-01T00:00:00Z").annualMonthlyMxn, 0);
  // Por omisión la renovación pasa directo al cliente: no cuenta como ingreso.
  assert.equal(computeMonthCosts(zero, s, "2027-11-01T00:00:00Z").annualMonthlyMxn, 0);
  const own = { ...s, annual: { ...s.annual, passThrough: false } };
  assert.equal(computeMonthCosts(zero, own, "2026-11-01T00:00:00Z").annualMonthlyMxn, 0);
  const after = computeMonthCosts(zero, own, "2027-11-01T00:00:00Z");
  assert.equal(after.annualMonthlyMxn, Math.round((1780 / 12) * 100) / 100);
  assert.equal(after.revenueMxn, Math.round((20000 + 1780 / 12) * 100) / 100);
});

test("sin cuota no hay porcentaje de margen y sin consumo no hay costo variable", () => {
  const c = computeMonthCosts({ ...usage, scans: 0, emails: 0, geminiIn: 0, geminiOut: 0, ttsChars: 0 }, { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 0 } });
  assert.equal(c.marginPct, null);
  assert.equal(c.variableMxn, 0);
  const withFixed = computeMonthCosts({ ...usage, scans: 0, emails: 0, geminiIn: 0, geminiOut: 0, ttsChars: 0 }, { ...DEFAULT_SETTINGS, fixed: [{ name: "Dominio", amount: 30, currency: "MXN" }] });
  assert.equal(withFixed.fixedMxn, 30);
});

test("plan de 406 pesos con IVA: cuota neta de 350, cupos y cuota de equilibrio", () => {
  const c = computeMonthCosts({ ...usage, scans: 400, emails: 600, conversations: 250 }, DEFAULT_SETTINGS);
  assert.equal(c.feeMxn, 350);
  assert.deepEqual(c.planUsage.map((x) => [x.limit, x.pct]), [[1000, 40], [1500, 40], [3000, 27]]);
  assert.equal(c.planUsage[2].reference, true);
  // Sin costos fijos propios, con 350 netos el margen es positivo salvo el consumo variable
  assert.equal(c.fixedMxn, 0);
  const idle = computeMonthCosts({ ...usage, geminiIn: 0, geminiOut: 0, ttsChars: 0, scans: 400, emails: 600 }, DEFAULT_SETTINGS);
  assert.equal(idle.marginMxn, 350);
  assert.equal(c.breakEvenWithIva, 0);
  const own = computeMonthCosts({ ...usage, scans: 400 }, { ...DEFAULT_SETTINGS, shen: { ...DEFAULT_SETTINGS.shen, paidByClient: false } });
  assert.equal(own.breakEvenWithIva, Math.ceil((own.fixedMxn + 500 * 0.2 * 21.5) * 1.16));
});

test("presupuesto de IA: costo por respuesta, uso del presupuesto, proyección y capacidad", () => {
  // 2M tokens de entrada y 0,5M de salida = 0,40 USD = 7,4 MXN en 800 respuestas
  const c = computeMonthCosts(usage, DEFAULT_SETTINGS, "2026-10-01T00:00:00Z", 0.5);
  assert.equal(c.ai.budgetMxn, 70); // 20% de 350
  assert.equal(c.ai.costMxn, 7.4);
  assert.equal(c.ai.costPerResponseMxn, 0.0093);
  assert.equal(c.ai.usedPct, 11);
  assert.equal(c.ai.projectedMxn, 14.8);
  assert.equal(c.ai.projectedResponses, 1600);
  assert.equal(c.ai.capacityResponses, Math.floor(70 / (7.4 / 800)));
  assert.equal(computeMonthCosts({ ...usage, winnieResponses: 0 }, DEFAULT_SETTINGS).ai.capacityResponses, null);
});

test("mergeSettings completa lo que falte con los valores por omisión", () => {
  const s = mergeSettings({ feeMxn: 1000, shen: { included: 300, extraEur: 0.25, paidByClient: false } });
  assert.equal(s.feeMxn, 1000);
  assert.equal(s.shen.included, 300);
  assert.equal(s.gemini.inputUsdPerM, DEFAULT_SETTINGS.gemini.inputUsdPerM);
  assert.equal(s.fixed.length, DEFAULT_SETTINGS.fixed.length);
});
