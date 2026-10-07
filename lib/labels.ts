import { BRAND } from "./brand";

export const AREA_STATUS = ["Vas bien aquí", "Atención ligera", "A reforzar", "Prioridad principal"] as const;

// WeNow 360: cada producto tiene precio público y precio Miembro Club WeNow (lista MX 2026).
// En la base de datos: publicPrice = público, distributorPrice = miembro.
export const MEMBER_LABEL = `Miembro ${BRAND.club}`;
export const MEMBERSHIP_PITCH = `Hazte miembro del ${BRAND.club} y paga precio miembro en cada producto`;

export const memberDiscountPct = (publicTotal: number, memberTotal: number) =>
  publicTotal > 0 ? Math.round((1 - memberTotal / publicTotal) * 100) : 0;

export const money = (n: number) => `$${n.toLocaleString(BRAND.locale)}`;

export const formatMexicoDateTime = (iso: string) =>
  new Intl.DateTimeFormat(BRAND.locale, {
    timeZone: BRAND.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
