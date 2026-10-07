import { money } from "./labels";

// Paquetes del Club WeNow, lista de precios México 2026 (final). No incluye puntos QV/CV ni bonos: son parte
// del plan de compensación del negocio y no se muestran al público ni a Winnie.
export type ClubPackage = { id: string; name: string; products: number; price: number; shipping: number; detail: string };

export const CLUB_PACKAGES: ClubPackage[] = [
  { id: "inscripcion", name: "Inscripción", products: 4, price: 3200, shipping: 200, detail: "4 nutracéuticos de tu elección; es la forma de hacerte miembro del Club WeNow." },
  { id: "zafiro", name: "Inscripción y recompra Zafiro", products: 15, price: 9800, shipping: 200, detail: "15 nutracéuticos de tu elección." },
  { id: "esmeralda", name: "Inscripción y recompra Esmeralda", products: 30, price: 19900, shipping: 200, detail: "30 nutracéuticos de tu elección." },
  { id: "recompra", name: "Recompra", products: 4, price: 2900, shipping: 200, detail: "4 nutracéuticos de tu elección para miembros que vuelven a comprar." },
  { id: "bonus", name: "Paquete Bonus", products: 4, price: 2128, shipping: 200, detail: "4 nutracéuticos de tu elección con precio especial." },
  { id: "almacen", name: "Paquete de almacén", products: 70, price: 36000, shipping: 200, detail: "70 nutracéuticos de tu elección." },
];

export const PACKAGES_NOTE = "El costo de envío no se aplica si el pedido se recibe en una sucursal.";

export function packagesText() {
  return [
    "Paquetes del Club WeNow (precios de México, en pesos mexicanos):",
    ...CLUB_PACKAGES.map((p) => `- ${p.name}: ${money(p.price)} MXN + ${money(p.shipping)} MXN de envío. ${p.detail}`),
    PACKAGES_NOTE,
  ].join("\n");
}
