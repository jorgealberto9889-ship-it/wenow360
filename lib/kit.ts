// Kit de inscripción del Club WeNow: membresía + 4 productos a elegir a precio de kit.
// Módulo puro (sin dependencias de UI) para que resultado, correos, seguimiento y Winnie usen los mismos números.
import { memberDiscountPct } from "./labels";

export const MEMBERSHIP_FEE = 300;
export const KIT_SIZE = 4;
export const KIT_PRODUCT_PRICE = 725; // precio por producto dentro del kit de 4
export const SHIPPING = 200;
export const PUBLIC_REFERENCE = 990; // precio público de un producto de la línea (para completar huecos)
export const KIT_TOTAL = MEMBERSHIP_FEE + KIT_SIZE * KIT_PRODUCT_PRICE; // 3,200
export const SHIPPING_NOTE = `+ ${"$"}${SHIPPING} de envío; gratis en sucursal`;

type Priced = { publicPrice: number; distributorPrice: number };

export function kitOffer<T extends Priced>(selected: T[]) {
  const inKit = selected.slice(0, KIT_SIZE);
  const extras = selected.slice(KIT_SIZE);
  const missing = Math.max(0, KIT_SIZE - selected.length);
  const extrasPay = extras.reduce((s, p) => s + p.distributorPrice, 0);
  const pub = selected.reduce((s, p) => s + p.publicPrice, 0) + missing * PUBLIC_REFERENCE;
  const pay = KIT_TOTAL + extrasPay;
  return {
    inKit,
    extras,
    missing,
    complete: missing === 0,
    kitProducts: inKit.length * KIT_PRODUCT_PRICE + missing * KIT_PRODUCT_PRICE,
    membership: MEMBERSHIP_FEE,
    pub,
    pay,
    savings: Math.max(0, pub - pay),
    pct: memberDiscountPct(pub, pay),
  };
}
