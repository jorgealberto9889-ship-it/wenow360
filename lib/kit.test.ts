import assert from "node:assert/strict";
import { test } from "node:test";
import { KIT_TOTAL, kitOffer } from "./kit";

const p = (publicPrice = 990, distributorPrice = 760) => ({ publicPrice, distributorPrice });

test("4 productos: kit de $3,200 contra $3,960 público", () => {
  const o = kitOffer([p(), p(), p(), p()]);
  assert.equal(KIT_TOTAL, 3200);
  assert.equal(o.pay, 3200);
  assert.equal(o.pub, 3960);
  assert.equal(o.savings, 760);
  assert.equal(o.complete, true);
});

test("3 productos: se completa con un hueco a elegir", () => {
  const o = kitOffer([p(), p(), p()]);
  assert.equal(o.missing, 1);
  assert.equal(o.pay, 3200);
  assert.equal(o.pub, 3960);
});

test("5 productos: el extra va a precio miembro suelto", () => {
  const o = kitOffer([p(), p(), p(), p(), p()]);
  assert.equal(o.extras.length, 1);
  assert.equal(o.pay, 3200 + 760);
});
