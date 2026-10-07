import { BRAND } from "../brand";

const TZ = BRAND.timeZone;

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

// "Hoy, 10:42" · "Ayer, 18:30" · "19 sep" · "19 sep 2025"
export function shortDate(iso: string, now = new Date()) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  if (dayKey(d) === dayKey(now)) return `Hoy, ${time}`;
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return `Ayer, ${time}`;
  const sameYear = dayKey(d).slice(0, 4) === dayKey(now).slice(0, 4);
  return new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
    .format(d)
    .replace(".", "");
}

export const longDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)).replace(".", "");

export const initials = (name: string) =>
  name
    .replace(/^(q\.?\s?b\.?|dr\.?|dra\.?|lic\.?|ing\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export const pct = (part: number, total: number) => (total ? Math.round((part / total) * 1000) / 10 : 0);

export const PERIODS = { "7": "Últimos 7 días", "30": "Últimos 30 días", "90": "Últimos 90 días", todo: "Todo el historial" } as const;
export type Period = keyof typeof PERIODS;
export const parsePeriod = (v: string | string[] | undefined): Period => (typeof v === "string" && v in PERIODS ? (v as Period) : "30");
export const periodStart = (p: Period) => (p === "todo" ? "0000" : new Date(Date.now() - Number(p) * 86_400_000).toISOString());

export const LEAD_STATUS = {
  nuevo: { label: "Nuevo", bg: "#fbeef4", color: "#a51959" },
  contactado: { label: "Contactado", bg: "#fff6df", color: "#916000" },
  en_seguimiento: { label: "En seguimiento", bg: "#f8edf2", color: "#d3427e" },
  convertido: { label: "Convertido", bg: "#e5f8ef", color: "#087748" },
  no_interesado: { label: "No interesado", bg: "#f5eef0", color: "#7a6570" },
  cerrado: { label: "Cerrado", bg: "#f2efef", color: "#6f6a6c" },
} as const;
export type LeadStatus = keyof typeof LEAD_STATUS;
export const isLeadStatus = (v: unknown): v is LeadStatus => typeof v === "string" && v in LEAD_STATUS;

export const LINE_STYLE = {
  nutriday_plus: { label: "NutriDay Plus", bg: "#fbeef4", color: "#a51959" },
  club_wenow: { label: "Club WeNow", bg: "#f2efef", color: "#5a5456" },
} as const;
