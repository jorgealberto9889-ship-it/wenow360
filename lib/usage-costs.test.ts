import assert from "node:assert/strict";
import test from "node:test";
import { computeMonthCosts, DEFAULT_SETTINGS, mergeSettings, renewalDate, type MonthUsage } from "./usage-costs";

const usage: MonthUsage = { scans: 520, emails: 3500, geminiIn: 2_000_000, geminiOut: 500_000, ttsChars: 1_500_000, assessments: 100, winnieQuestions: 300, conversations: 120 };

test("costos del mes: fijos, variables y margen contra la cuota", () => {
  const s = { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 29000 } };
  const c = computeMonthCosts(usage, s);
  // Shen 500 EUR + Vercel 20 USD en pesos
  assert.equal(c.fixedMxn, 500 * 21.5 + 20 * 18.5);
  // 20 escaneos extra a 0,20 EUR
  assert.equal(c.variableLines[0].costMxn, 20 * 0.2 * 21.5);
  // Gemini: 2M*0.10 + 0.5M*0.40 = 0.40 USD; TTS: 0.5M*16/1M = 8 USD; correos: 500*0.0004 = 0.2 USD
  assert.equal(c.variableLines[1].costMxn, 0.4 * 18.5);
  assert.equal(c.variableLines[2].costMxn, 8 * 18.5);
  assert.equal(c.variableLines[3].costMxn, Math.round(0.2 * 18.5 * 100) / 100);
  assert.equal(c.totalMxn, Math.round((c.fixedMxn + c.variableMxn) * 100) / 100);
  assert.equal(c.feeMxn, 25000);
  assert.equal(c.marginMxn, Math.round((25000 - c.totalMxn) * 100) / 100);
  assert.ok((c.marginPct ?? 0) > 0);
  assert.equal(c.shenQuotaUsedPct, 104);
});

test("renovación anual: gratis el primer año y luego 1/12 al mes de ingreso", () => {
  const s = { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 23200 } };
  const zero: MonthUsage = { scans: 0, emails: 0, geminiIn: 0, geminiOut: 0, ttsChars: 0, assessments: 0, winnieQuestions: 0, conversations: 0 };
  assert.equal(renewalDate(s.annual).toISOString().slice(0, 10), "2027-10-10");
  assert.equal(computeMonthCosts(zero, s, "2026-11-01T00:00:00Z").annualMonthlyMxn, 0);
  const after = computeMonthCosts(zero, s, "2027-11-01T00:00:00Z");
  assert.equal(after.annualMonthlyMxn, Math.round((1780 / 12) * 100) / 100);
  assert.equal(after.revenueMxn, Math.round((20000 + 1780 / 12) * 100) / 100);
});

test("sin cuota no hay porcentaje de margen; sin consumo solo hay costos fijos; el plan de 406 pesos pierde dinero", () => {
  const c = computeMonthCosts({ ...usage, scans: 0, emails: 0, geminiIn: 0, geminiOut: 0, ttsChars: 0 }, { ...DEFAULT_SETTINGS, plan: { ...DEFAULT_SETTINGS.plan, priceWithIva: 0 } });
  assert.equal(c.marginPct, null);
  assert.equal(c.variableMxn, 0);
  assert.ok(c.fixedMxn > 0);
});

test("plan de 406 pesos con IVA: cuota neta de 350, cupos y cuota de equilibrio", () => {
  const c = computeMonthCosts({ ...usage, scans: 400, emails: 600, conversations: 250 }, DEFAULT_SETTINGS);
  assert.equal(c.feeMxn, 350);
  assert.deepEqual(c.planUsage.map((x) => [x.limit, x.pct]), [[1000, 40], [1500, 40], [500, 50]]);
  assert.ok(c.marginMxn < 0);
  // costos fijos + 500 escaneos extra a 0,20 EUR, con IVA
  assert.equal(c.breakEvenWithIva, Math.ceil((c.fixedMxn + 500 * 0.2 * 21.5) * 1.16));
});

test("mergeSettings completa lo que falte con los valores por omisión", () => {
  const s = mergeSettings({ feeMxn: 1000, shen: { included: 300, extraEur: 0.25 } });
  assert.equal(s.feeMxn, 1000);
  assert.equal(s.shen.included, 300);
  assert.equal(s.gemini.inputUsdPerM, DEFAULT_SETTINGS.gemini.inputUsdPerM);
  assert.equal(s.fixed.length, DEFAULT_SETTINGS.fixed.length);
});
