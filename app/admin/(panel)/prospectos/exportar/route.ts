import { LEAD_STATUS, longDate, parsePeriod } from "@/lib/admin/format";
import { prospectList } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/dal";
import { db, schema } from "@/db";

// CSV con los mismos filtros de la tabla. Solo datos de contacto y seguimiento, nunca respuestas de salud.
export async function GET(request: Request) {
  const admin = await requireAdmin();
  const sp = new URL(request.url).searchParams;
  const { items } = await prospectList({
    q: sp.get("q") ?? undefined,
    distributor: sp.get("distribuidor") ?? undefined,
    status: sp.get("estatus") ?? undefined,
    period: parsePeriod(sp.get("dias") ?? "todo"),
    page: 1,
    perPage: 10_000,
  });
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    ["Nombre", "Correo", "Teléfono", "Distribuidor", "Fecha", "Áreas principales", "Autorizó contacto", "Estatus"],
    ...items.map((p) => [
      p.name, p.email, p.phone, p.distributorName ?? p.distributorSlug, longDate(p.date),
      p.areas.join(", "), p.authorized ? "Sí" : "No", LEAD_STATUS[p.status].label,
    ]),
  ];
  await db.insert(schema.auditLogs).values({ actorId: admin.id, actorType: "admin", action: "prospects_exported", entity: "prospects", entityId: String(items.length) });
  // BOM para que Excel respete los acentos.
  return new Response("﻿" + lines.map((l) => l.map(cell).join(",")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospectos-wenow360-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
