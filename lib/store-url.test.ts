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
