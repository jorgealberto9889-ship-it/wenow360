import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { decidePayment, externalReference, parseExternalReference, verifySignature } from "./mercadopago-core";

const sign = (secret: string, id: string, req: string, ts: string) => createHmac("sha256", secret).update(`id:${id};request-id:${req};ts:${ts};`).digest("hex");

test("la referencia del cobro va y vuelve", () => {
  assert.equal(externalReference("2026-11"), "wenow-2026-11");
  assert.equal(parseExternalReference("wenow-2026-11"), "2026-11");
  assert.equal(parseExternalReference("wenow-2026-13"), null);
  assert.equal(parseExternalReference("otra-cosa"), null);
  assert.equal(parseExternalReference(undefined), null);
});

test("firma del webhook: válida, alterada y sin clave", () => {
  const v1 = sign("clave", "123456", "req-1", "1700000000");
  const ok = { xSignature: `ts=1700000000,v1=${v1}`, xRequestId: "req-1", dataId: "123456", secret: "clave" };
  assert.equal(verifySignature(ok), true);
  assert.equal(verifySignature({ ...ok, dataId: "999" }), false);
  assert.equal(verifySignature({ ...ok, secret: "otra" }), false);
  assert.equal(verifySignature({ ...ok, xSignature: "ts=1700000000,v1=abc" }), false);
  assert.equal(verifySignature({ ...ok, secret: "" }), false);
  assert.equal(verifySignature({ ...ok, xSignature: null }), false);
});

test("solo se registra un pago aprobado, en MXN, del mes y por el monto del plan", () => {
  const base = { id: 77, status: "approved", external_reference: "wenow-2026-11", transaction_amount: 406, currency_id: "MXN", date_approved: "2026-11-18T10:00:00.000-06:00" };
  const d = decidePayment(base, 406);
  assert.equal(d.action, "registrar");
  if (d.action === "registrar") { assert.equal(d.periodKey, "2026-11"); assert.equal(d.amountMxn, 406); assert.equal(d.reference, "mp:77"); }
  assert.equal(decidePayment({ ...base, status: "pending" }, 406).action, "ignorar");
  assert.equal(decidePayment({ ...base, status: "rejected" }, 406).action, "ignorar");
  assert.equal(decidePayment({ ...base, external_reference: "x" }, 406).action, "ignorar");
  assert.equal(decidePayment({ ...base, transaction_amount: 100 }, 406).action, "ignorar");
  assert.equal(decidePayment({ ...base, currency_id: "USD" }, 406).action, "ignorar");
  assert.equal(decidePayment({ ...base, transaction_amount: 500 }, 406).action, "registrar");
});

test("un reembolso o contracargo revierte el pago", () => {
  assert.deepEqual(decidePayment({ id: 9, status: "refunded" }, 406), { action: "revertir", reference: "mp:9" });
  assert.deepEqual(decidePayment({ id: 9, status: "charged_back" }, 406), { action: "revertir", reference: "mp:9" });
});
