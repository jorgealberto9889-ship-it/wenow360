import { test } from "node:test";
import assert from "node:assert/strict";
import { WENOW_PRODUCTS } from "../../scripts/data/wenow-catalog";
import { answersSchema, type AnswersInput } from "./answers";
import { calculateResult, type EngineProduct } from "./engine";

const catalog: EngineProduct[] = WENOW_PRODUCTS.map((p) => ({ id: p.id, type: p.type, active: true, goals: p.goals }));

const baseInput: AnswersInput = {
  age: 35, biologicalSex: "female", pregnancy: "no",
  heightCm: 165, heightCertainty: "exact", weightKg: 64, weightCertainty: "approximate",
  primaryGoal: "energy", secondaryGoals: [],
  metrics: { energy: 3, stress: 1, sleep: 1, weight: 0, digestion: 0, focus: -1, muscle: -1, mobility: -1 },
  commitment: "ready",
  sleepHours: "7-8", waterGlasses: "1.5-2l", produceServings: "most-days", activityLevel: "moderate",
  tobacco: "never", alcohol: "occasional",
  caffeineSensitive: "no", swallowing: "no",
  dietary: ["none"], medications: ["none"], conditions: ["none"],
  conditionDetails: "", medicationDetails: "",
};

const answers = (patch: Partial<AnswersInput> = {}) => answersSchema.parse({ ...baseInput, ...patch });
const ids = (r: ReturnType<typeof calculateResult>) => r.recommendations.map((x) => x.productId);

test("el catálogo trae los 15 productos con ingredientes, uso y y precios MX 2026", () => {
  assert.equal(WENOW_PRODUCTS.length, 15);
  assert.equal(new Set(WENOW_PRODUCTS.map((p) => p.id)).size, 15);
  for (const p of WENOW_PRODUCTS) {
    assert.ok(p.ingredients.length > 10, p.id);
    assert.ok(p.usage.length > 10, p.id);
    assert.ok(p.highlights.benefits.length >= 3, p.id);
    assert.ok((p.highlights.catalogBenefits?.length ?? 0) >= 4, p.id);
    assert.equal(p.publicPrice, p.id === "endo" ? 1350 : 990, p.id);
    assert.equal(p.distributorPrice, p.id === "endo" ? 960 : 760, p.id);
  }
});

test("menores de edad, embarazo y cáncer activo detienen las recomendaciones", () => {
  assert.equal(calculateResult(answers({ age: 16 }), catalog).stopped, true);
  const pregnant = calculateResult(answers({ pregnancy: "yes" }), catalog);
  assert.equal(pregnant.stopped, true);
  assert.deepEqual(pregnant.recommendations, []);
  assert.equal(calculateResult(answers({ conditions: ["cancer-treatment"] }), catalog).stopped, true);
});

test("objetivo de energía pone un producto de energía como esencial", () => {
  const r = calculateResult(answers(), catalog);
  assert.ok(["synergy", "active-burn", "regenerex"].includes(r.recommendations[0].productId));
  assert.equal(r.recommendations[0].priorityLabel, "esencial");
  assert.ok(r.recommendations[0].reasonCodes.includes("goal_primary:energy"));
});

test("objetivo de peso pone PureBody; depuración pone Green Plus", () => {
  const weight = calculateResult(answers({ primaryGoal: "weight", metrics: { ...baseInput.metrics, weight: 2 } }), catalog);
  assert.equal(weight.recommendations[0].productId, "purebody");
  const detox = calculateResult(answers({ primaryGoal: "detox" }), catalog);
  assert.equal(detox.recommendations[0].productId, "green-plus");
});

test("sueño y estrés llevan a NK+ / Neuro CHAI / ENDO", () => {
  const r = calculateResult(
    answers({ primaryGoal: "sleep", secondaryGoals: ["stress"], metrics: { ...baseInput.metrics, sleep: 3, stress: 3 } }),
    catalog,
  );
  assert.equal(r.recommendations[0].productId, "nk-plus");
  assert.ok(ids(r).some((id) => id === "neuro-chai" || id === "endo"));
});

test("un solo estimulante, una sola proteína y un solo colágeno por kit", () => {
  const energetic = ids(calculateResult(
    answers({ primaryGoal: "energy", secondaryGoals: ["weight", "focus"], metrics: { ...baseInput.metrics, energy: 3, weight: 3, focus: 3 } }),
    catalog,
  ));
  assert.ok(energetic.filter((id) => ["active-burn", "regenerex", "synergy"].includes(id)).length <= 1);
  const muscular = ids(calculateResult(answers({ primaryGoal: "muscle", metrics: { ...baseInput.metrics, muscle: 3 } }), catalog));
  assert.ok(muscular.filter((id) => id.startsWith("nutriday")).length <= 1);
  const skin = ids(calculateResult(answers({ primaryGoal: "skin", secondaryGoals: ["female", "male"] }), catalog));
  assert.ok(skin.filter((id) => id.startsWith("collagen")).length <= 1);
});

test("los colágenos por género respetan el sexo y el objetivo elegido", () => {
  const woman = ids(calculateResult(answers({ primaryGoal: "skin", biologicalSex: "female" }), catalog));
  assert.ok(woman.includes("collagen-woman"));
  assert.ok(!woman.includes("collagen-man"));
  const man = ids(calculateResult(answers({ primaryGoal: "skin", biologicalSex: "male", pregnancy: "not-applicable" }), catalog));
  assert.ok(man.includes("collagen-man"));
  assert.ok(!man.includes("collagen-woman"));
});

test("sensibilidad a la cafeína excluye café, guaraná y té verde", () => {
  const r = calculateResult(answers({ caffeineSensitive: "yes", primaryGoal: "energy", secondaryGoals: ["sleep", "weight"] }), catalog);
  for (const id of ["active-burn", "regenerex", "synergy", "nk-plus"]) assert.ok(!ids(r).includes(id), id);
});

test("alergias y dieta excluyen proteína, calostro y colágeno", () => {
  const profile = { primaryGoal: "muscle" as const, secondaryGoals: ["immune" as const], metrics: { ...baseInput.metrics, muscle: 3 } };
  const milk = ids(calculateResult(answers({ ...profile, dietary: ["milk-egg"] }), catalog));
  for (const id of ["nutriday-red", "nutriday-brown", "transfactor"]) assert.ok(!milk.includes(id), id);
  const vegan = ids(calculateResult(answers({ ...profile, secondaryGoals: ["skin"], dietary: ["vegan"] }), catalog));
  for (const id of ["nutriday-red", "nutriday-brown", "transfactor", "collagen-woman", "collagen-man", "regenerex"]) assert.ok(!vegan.includes(id), id);
  const nuts = ids(calculateResult(answers({ ...profile, dietary: ["nuts"] }), catalog));
  assert.ok(!nuts.includes("nutriday-brown"));
});

test("dificultad para tragar excluye las cápsulas", () => {
  const r = ids(calculateResult(answers({ swallowing: "yes", primaryGoal: "weight", secondaryGoals: ["immune", "longevity"] }), catalog));
  for (const id of ["purebody", "nk-plus", "transfactor", "resnad"]) assert.ok(!r.includes(id), id);
});

test("condiciones y medicamentos excluyen lo que corresponde", () => {
  const energy = { primaryGoal: "energy" as const, secondaryGoals: ["weight" as const] };
  assert.ok(!ids(calculateResult(answers({ ...energy, conditions: ["hypertension"] }), catalog)).includes("synergy"));
  assert.ok(!ids(calculateResult(answers({ ...energy, conditions: ["heart"] }), catalog)).includes("regenerex"));
  assert.ok(!ids(calculateResult(answers({ primaryGoal: "stress", medications: ["other"] }), catalog)).includes("endo"));
  assert.ok(!ids(calculateResult(answers({ primaryGoal: "longevity", medications: ["anticoagulant"] }), catalog)).includes("resnad"));
  assert.ok(!ids(calculateResult(answers({ primaryGoal: "immune", conditions: ["autoimmune"] }), catalog)).includes("transfactor"));
  const risk = calculateResult(answers({ primaryGoal: "weight", conditions: ["eating-risk"] }), catalog);
  assert.ok(!ids(risk).includes("purebody"));
  assert.ok(risk.reviewNotes.some((n) => n.includes("WeNow 360")));
});

test("productos inactivos o sin afinidad nunca se recomiendan", () => {
  const inactive = catalog.map((p) => (p.id === "nk-plus" ? { ...p, active: false } : p));
  const r = calculateResult(answers({ primaryGoal: "sleep", metrics: { ...baseInput.metrics, sleep: 3 } }), inactive);
  assert.ok(!ids(r).includes("nk-plus"));
  assert.ok(r.recommendations.every((x) => x.relevanceScore > 0));
});

test("respiración acelerada suma solo al eje de estrés; la frecuencia cardiaca no puntúa", () => {
  const a = answers({ primaryGoal: "stress", metrics: { ...baseInput.metrics, stress: 1 } });
  const score = (r: ReturnType<typeof calculateResult>, id: string) => r.recommendations.find((x) => x.productId === id)?.relevanceScore ?? 0;
  const plain = calculateResult(a, catalog);
  const fastBreath = calculateResult(a, catalog, { heartRateBpm: 72, respiratoryRateBpm: 24 });
  const fastHeart = calculateResult(a, catalog, { heartRateBpm: 118, respiratoryRateBpm: 16 });
  assert.equal(score(fastBreath, "nk-plus") - score(plain, "nk-plus"), 3);
  assert.deepEqual(fastHeart.recommendations, plain.recommendations);
  assert.equal(fastBreath.biometric?.respiratoryRate?.label, "Ligeramente acelerada");
  assert.ok(fastBreath.recommendations.find((x) => x.productId === "nk-plus")?.reasonCodes.includes("biometric:respiratory_elevated"));
  assert.deepEqual(fastBreath.areas, plain.areas);
});

test("el índice de estrés de Shen.AI (≥5) suma una sola vez al eje de estrés y la VFC no puntúa", () => {
  const a = answers({ primaryGoal: "stress", metrics: { ...baseInput.metrics, stress: 1 } });
  const score = (r: ReturnType<typeof calculateResult>, id: string) => r.recommendations.find((x) => x.productId === id)?.relevanceScore ?? 0;
  const calm = { heartRateBpm: 70, respiratoryRateBpm: 16 };
  const plain = calculateResult(a, catalog, calm);
  const stressed = calculateResult(a, catalog, { ...calm, stressIndex: 6.5, hrvSdnnMs: 30, parasympatheticActivity: 40 });
  const both = calculateResult(a, catalog, { ...calm, respiratoryRateBpm: 24, stressIndex: 8 });
  const lowStress = calculateResult(a, catalog, { ...calm, stressIndex: 3, hrvSdnnMs: 80 });
  assert.equal(score(stressed, "nk-plus") - score(plain, "nk-plus"), 3);
  assert.equal(score(both, "nk-plus"), score(stressed, "nk-plus"));
  assert.deepEqual(lowStress.recommendations, plain.recommendations);
  assert.ok(stressed.recommendations.find((x) => x.productId === "nk-plus")?.reasonCodes.includes("biometric:stress_elevated"));
  assert.equal(stressed.biometric?.stress?.label, "Carga elevada");
  assert.equal(calculateResult(a, catalog, { ...calm, stressIndex: 9.4 }).biometric?.stress?.label, "Carga muy elevada");
  assert.equal(stressed.biometric?.values.parasympatheticActivity, 40);
});

test("el esquema rechaza severidades de objetivos no elegidos y limpia 'none'", () => {
  assert.equal(answersSchema.safeParse({ ...baseInput, metrics: { ...baseInput.metrics, focus: 2 } }).success, false);
  assert.equal(answersSchema.safeParse({ ...baseInput, secondaryGoals: ["focus"] }).success, false);
  assert.equal(answersSchema.safeParse({ ...baseInput, secondaryGoals: ["energy"] }).success, false);
  assert.deepEqual(answers({ conditions: ["none", "kidney", "kidney"] }).conditions, ["kidney"]);
});
