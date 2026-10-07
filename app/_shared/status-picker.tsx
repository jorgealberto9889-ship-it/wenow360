"use client";

import { useTransition } from "react";
import { LEAD_STATUS, type LeadStatus } from "@/lib/admin/format";

// Botones de estatus del seguimiento; la acción decide quién puede cambiarlo (admin o distribuidor).
export function StatusPicker({ status, action }: { status: LeadStatus; action: (status: LeadStatus) => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      {(Object.keys(LEAD_STATUS) as LeadStatus[]).map((s) => {
        const active = s === status;
        return (
          <button
            key={s}
            type="button"
            disabled={pending || active}
            aria-pressed={active}
            onClick={() => start(() => action(s))}
            className="press rounded-full border-[1.5px] px-3 py-1.5 text-[12px] font-bold disabled:cursor-default"
            style={active ? { background: LEAD_STATUS[s].bg, color: LEAD_STATUS[s].color, borderColor: LEAD_STATUS[s].color } : { borderColor: "var(--line)", color: "#4a4547", background: "#fff", opacity: pending ? 0.6 : 1 }}
          >
            {LEAD_STATUS[s].label}
          </button>
        );
      })}
    </div>
  );
}
