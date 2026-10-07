import Link from "next/link";
import type { ReactNode } from "react";
import { initials, LEAD_STATUS, PERIODS, type LeadStatus, type Period } from "@/lib/admin/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--line)] bg-white ${className}`}>{children}</div>
);

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "good" | "bad" }) {
  return (
    <Panel className="p-[18px]">
      <div className="font-mono text-[10px] font-semibold tracking-[0.05em] text-[var(--muted)] uppercase">{label}</div>
      <div className="mt-2 text-[28px] font-extrabold text-[var(--navy)]">{value}</div>
      {note && (
        <div className={`mt-1 text-[11.5px] font-semibold ${tone === "bad" ? "text-[var(--red)]" : tone === "good" ? "text-[#0d9a56]" : "text-[var(--muted)]"}`}>{note}</div>
      )}
    </Panel>
  );
}

export function Bars({ title, items, color = "var(--blue)", empty }: { title: string; items: { label: string; n: number; color?: string }[]; color?: string; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <Panel className="p-5">
      <h2 className="text-[14px] font-bold text-[var(--navy)]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-[var(--muted)]">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.label}>
              <div className="mb-[5px] flex justify-between text-[12.5px]">
                <span className="font-semibold text-[#4a4547]">{i.label}</span>
                <span className="text-[var(--muted)]">{i.n}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f2efef]">
                <div className="h-full rounded-full" style={{ width: `${(i.n / max) * 100}%`, background: i.color ?? color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export const StatusBadge = ({ status }: { status: LeadStatus }) => (
  <span className="inline-block rounded-full px-[11px] py-[5px] text-[11px] font-bold whitespace-nowrap" style={{ background: LEAD_STATUS[status].bg, color: LEAD_STATUS[status].color }}>
    {LEAD_STATUS[status].label}
  </span>
);

export const Avatar = ({ name, bg = "#fbeef4", color = "var(--blue)" }: { name: string; bg?: string; color?: string }) => (
  <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: bg, color }}>
    {initials(name) || "·"}
  </span>
);

export const fieldClass = "rounded-[10px] border border-[var(--line)] bg-white px-3.5 py-2.5 text-[13px] text-[#4a4547] outline-none focus:border-[var(--blue)]";

export function PeriodSelect({ value }: { value: Period }) {
  return (
    <select name="dias" defaultValue={value} className={fieldClass} aria-label="Periodo">
      {Object.entries(PERIODS).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  );
}

export function Pagination({ page, total, perPage, href }: { page: number; total: number; perPage: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const btn = "press flex size-8 items-center justify-center rounded-[9px] border text-[13px]";
  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="text-[12px] text-[#8a8587]">{total === 0 ? "Sin resultados" : `Mostrando ${from}–${to} de ${total}`}</div>
      {pages > 1 && (
        <div className="flex gap-1.5">
          {page > 1 && <Link href={href(page - 1)} className={`${btn} border-[var(--line)] bg-white`} aria-label="Anterior">‹</Link>}
          <span className={`${btn} border-[var(--blue)] bg-[var(--blue)] font-bold text-white`}>{page}</span>
          {page < pages && <Link href={href(page + 1)} className={`${btn} border-[var(--line)] bg-white`} aria-label="Siguiente">›</Link>}
        </div>
      )}
    </div>
  );
}

export const tableHead = "font-mono text-[10.5px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase";
