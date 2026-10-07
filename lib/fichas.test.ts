import { test } from "node:test";
import assert from "node:assert/strict";
import { WENOW_PRODUCTS } from "../scripts/data/wenow-catalog";
import { CERTIFICATIONS, certificationsText } from "./certifications";
import { fichaPdfUrl } from "./fichas";
import { CLUB_PACKAGES, packagesText } from "./packages";

test("los 15 productos traen ficha técnica completa", () => {
  assert.equal(WENOW_PRODUCTS.length, 15);
  for (const p of WENOW_PRODUCTS) {
    const f = p.highlights.ficha;
    assert.ok(f, `${p.id}: falta ficha`);
    assert.ok(f.ingredients.length >= 4, `${p.id}: pocos ingredientes`);
    assert.ok(f.about.length > 80 && f.tagline.length > 20, `${p.id}: texto corto`);
    assert.ok(f.reco.length >= 3 && f.quick.length >= 4, `${p.id}: faltan datos`);
    for (const i of f.ingredients) {
      assert.ok(i.name && i.desc && i.comp.length > 0 && i.ben.length > 0 && i.dato, `${p.id}/${i.name}: ingrediente incompleto`);
    }
    // El texto de ingredientes del catálogo se arma con los nombres de la ficha.
    assert.ok(p.ingredients.startsWith(f.ingredients[0].name), p.id);
  }
});

test("los 15 productos tienen su ficha PDF", () => {
  for (const p of WENOW_PRODUCTS) assert.equal(fichaPdfUrl(p.id), `/fichas/${p.id}.pdf`);
});

test("sellos de calidad: solo los 5 del laboratorio y redacción prudente", () => {
  assert.deepEqual(CERTIFICATIONS.map((c) => c.id), ["gmp", "non-gmo", "gluten-free", "kosher", "cofepris"]);
  const t = certificationsText();
  assert.ok(t.includes("No digas que COFEPRIS"));
  assert.ok(!/432|Consejo M/.test(t));
});

test("paquetes del Club sin puntos ni bonos de compensación", () => {
  assert.equal(CLUB_PACKAGES.length, 6);
  const t = packagesText();
  assert.ok(t.includes("$3,200") && t.includes("$36,000"));
  assert.ok(!/QV|CV\b|Unilevel|bono/i.test(t));
});
