import assert from "node:assert/strict";
import test from "node:test";
import { parseStoreUrl } from "./store-url";

test("enlace de referido: solo https de wenow.global", () => {
  const ok = parseStoreUrl(" https://store.wenow.global/mx/products/paquete-de-lanzamiento?ref=abc123 ");
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.url, "https://store.wenow.global/mx/products/paquete-de-lanzamiento?ref=abc123");
  assert.equal(parseStoreUrl("https://wenow.global/tienda").ok, true);
  for (const bad of ["", "store.wenow.global/mx", "http://store.wenow.global/mx", "https://evil.com/store.wenow.global", "https://wenow.global.evil.com/x", "javascript:alert(1)"]) {
    assert.equal(parseStoreUrl(bad).ok, false, bad);
  }
});

import { productStoreUrl } from "./store-url";

test("enlace al producto conserva el referido del distribuidor", () => {
  // Referido que ya apunta a un producto: cambia el producto y conserva los parámetros.
  assert.equal(productStoreUrl("synergy", "https://store.wenow.global/mx/products/paquete-de-lanzamiento?ref=ABC"), "https://store.wenow.global/mx/products/synergy?ref=ABC");
  // Referido en la raíz de la tienda.
  assert.equal(productStoreUrl("nk-plus", "https://store.wenow.global/mx?ref=ABC"), "https://store.wenow.global/mx/products/nkplus?ref=ABC");
  assert.equal(productStoreUrl("nutriday-brown", "https://store.wenow.global/mx/products/paquete-de-lanzamiento"), "https://store.wenow.global/mx/products/nutriday");
  // Formato desconocido (identificación en la ruta) o producto sin página: no inventa nada.
  assert.equal(productStoreUrl("synergy", "https://store.wenow.global/mx/r/abc123"), "https://store.wenow.global/mx/r/abc123");
  assert.equal(productStoreUrl("no-existe", "https://store.wenow.global/mx/products/x"), "https://store.wenow.global/mx/products/x");
});
