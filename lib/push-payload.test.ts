import assert from "node:assert/strict";
import { test } from "node:test";
import { pushPayload } from "./push-payload";

test("aviso de prospecto nuevo: solo el primer nombre y enlace a su ficha", () => {
  const p = pushPayload({ kind: "nuevo_prospecto", name: "  Mariana López Díaz ", prospectId: "abc" });
  assert.equal(p.body, "Mariana terminó su evaluación y quiere que le contactes.");
  assert.equal(p.url, "/portal/prospecto/abc");
  assert.equal(p.tag, "prospecto-abc");
});

test("aviso de prueba lleva al inicio del portal", () => {
  assert.equal(pushPayload({ kind: "prueba" }).url, "/portal");
});
