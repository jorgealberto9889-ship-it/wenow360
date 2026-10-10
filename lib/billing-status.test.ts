import assert from "node:assert/strict";
import test from "node:test";
import { nextCharge } from "./billing-status";

const billing = { startMonth: "2026-11", dueDay: 10 };

test("antes del primer mes con cobro no hay adeudo", () => {
  const c = nextCharge(new Date("2026-10-11T12:00:00Z"), billing, []);
  assert.equal(c.state, "sin_cobro");
  assert.equal(c.periodKey, "2026-11");
  assert.equal(c.dueDate.toISOString().slice(0, 10), "2026-11-10");
});

test("mes en curso sin pagar: pendiente antes de la fecha y vencido después", () => {
  assert.equal(nextCharge(new Date("2026-11-05T12:00:00Z"), billing, []).state, "pendiente");
  const late = nextCharge(new Date("2026-11-12T12:00:00Z"), billing, []);
  assert.equal(late.state, "vencido");
  assert.equal(late.daysToDue, -2);
});

test("mes pagado: al corriente y el siguiente cobro es el mes que viene", () => {
  const c = nextCharge(new Date("2026-11-12T12:00:00Z"), billing, [{ periodKey: "2026-11", status: "pagado" }]);
  assert.equal(c.state, "al_corriente");
  assert.equal(c.periodKey, "2026-12");
  assert.equal(c.dueDate.toISOString().slice(0, 10), "2026-12-10");
});

test("cambio de año y días 29-31 se acotan al 28", () => {
  const c = nextCharge(new Date("2026-12-20T12:00:00Z"), { startMonth: "2026-11", dueDay: 31 }, [{ periodKey: "2026-12", status: "pagado" }]);
  assert.equal(c.periodKey, "2027-01");
  assert.equal(c.dueDate.toISOString().slice(0, 10), "2027-01-28");
  // un pago «pendiente» no cuenta como pagado
  assert.equal(nextCharge(new Date("2026-12-20T12:00:00Z"), billing, [{ periodKey: "2026-12", status: "pendiente" }]).state, "vencido");
});
