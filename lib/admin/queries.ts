import "server-only";
import type { InArgs } from "@libsql/client";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ResultSnapshot } from "../assessments";
import type { WellnessArea } from "../engine/engine";
import { isLeadStatus, periodStart, type LeadStatus, type Period } from "./format";

// SQL directo: los reportes cruzan varias tablas y así se leen mejor que con el query builder.
async function rows<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const r = await db.$client.execute({ sql, args });
  return r.rows as unknown as T[];
}
const one = async <T>(sql: string, args: InArgs = []) => (await rows<T>(sql, args))[0];

const LATEST_STATUS = "(select h.status from lead_status_history h where h.prospect_id = p.id order by h.changed_at desc limit 1)";
const LATEST_ASSESSMENT = "(select x.id from assessments x where x.prospect_id = p.id order by x.completed_at desc limit 1)";

export const topAreas = (areasJson: string | null, max = 2) => {
  if (!areasJson) return [];
  const areas = JSON.parse(areasJson) as WellnessArea[];
  return areas.filter((a) => a.metric && a.score >= 1).slice(0, max).map((a) => a.title);
};

// ---------- Resumen ----------

export async function overview(period: Period) {
  const since = periodStart(period);
  const [counts, areaRows, productRows, recent] = await Promise.all([
    one<{ completed: number; authorized: number; scans: number; emailFailed: number; celia: number; activeDistributors: number; inactiveDistributors: number; storeClicks: number }>(
      `select
        (select count(*) from assessments where status = 'completed' and completed_at >= ?1) as completed,
        (select count(*) from consents c join assessments a on a.id = c.assessment_id
          where c.consent_type = 'contacto_asesor' and c.accepted = 1 and a.completed_at >= ?1) as authorized,
        (select count(*) from biometric_readings b join assessments a on a.id = b.assessment_id where a.completed_at >= ?1) as scans,
        (select count(*) from email_events where status in ('failed', 'bounced') and created_at >= ?1) as emailFailed,
        (select count(distinct assessment_id) from assistant_messages where created_at >= ?1) as celia,
        (select count(*) from distributors where active = 1) as activeDistributors,
        (select count(*) from distributors where active = 0) as inactiveDistributors,
        (select count(*) from funnel_events where kind = 'tienda' and created_at >= ?1) as storeClicks`,
      [since],
    ),
    rows<{ areas: string }>(
      `select r.areas from assessment_results r join assessments a on a.id = r.assessment_id where a.completed_at >= ?`,
      [since],
    ),
    rows<{ name: string; line: string; n: number }>(
      `select pr.name, pr.line, count(*) as n from recommendations rc
        join assessment_results r on r.id = rc.assessment_result_id
        join assessments a on a.id = r.assessment_id
        join products pr on pr.id = rc.product_id
        where a.completed_at >= ? group by rc.product_id order by n desc limit 6`,
      [since],
    ),
    prospectList({ period, page: 1, perPage: 5 }),
  ]);

  const areaCount = new Map<string, number>();
  for (const r of areaRows) for (const title of topAreas(r.areas, 3)) areaCount.set(title, (areaCount.get(title) ?? 0) + 1);
  const areas = [...areaCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, n]) => ({ label, n }));

  return { counts, areas, products: productRows.map((p) => ({ ...p, n: Number(p.n) })), recent: recent.items };
}

// ---------- Prospectos ----------

export type ProspectFilters = { q?: string; distributor?: string; status?: string; period: Period; page: number; perPage?: number };

export async function prospectList(f: ProspectFilters) {
  const where: string[] = ["coalesce(a.completed_at, p.created_at) >= ?"];
  const args: (string | number)[] = [periodStart(f.period)];
  if (f.q?.trim()) {
    where.push("(p.name like ? or p.email like ? or p.phone like ?)");
    const like = `%${f.q.trim()}%`;
    args.push(like, like, like);
  }
  if (f.distributor) {
    where.push("p.distributor_slug = ?");
    args.push(f.distributor);
  }
  if (f.status && isLeadStatus(f.status)) {
    where.push(`coalesce(${LATEST_STATUS}, 'nuevo') = ?`);
    args.push(f.status);
  }
  const from = `from prospects p
    left join assessments a on a.id = ${LATEST_ASSESSMENT}
    left join assessment_results r on r.assessment_id = a.id
    left join distributors d on d.slug = p.distributor_slug
    where ${where.join(" and ")}`;
  const perPage = f.perPage ?? 25;
  const [total, items] = await Promise.all([
    one<{ n: number }>(`select count(*) as n ${from}`, args),
    rows<{
      id: string; name: string; email: string; phone: string; distributorSlug: string; distributorName: string | null;
      date: string; areas: string | null; status: string | null; authorized: number | null;
    }>(
      `select p.id, p.name, p.email, p.phone, p.distributor_slug as distributorSlug, d.display_name as distributorName,
        coalesce(a.completed_at, p.created_at) as date, r.areas, ${LATEST_STATUS} as status,
        (select c.accepted from consents c where c.assessment_id = a.id and c.consent_type = 'contacto_asesor') as authorized
       ${from} order by date desc limit ? offset ?`,
      [...args, perPage, (f.page - 1) * perPage],
    ),
  ]);
  return {
    total: Number(total?.n ?? 0),
    perPage,
    items: items.map((p) => ({
      ...p,
      areas: topAreas(p.areas),
      status: (isLeadStatus(p.status) ? p.status : "nuevo") as LeadStatus,
      authorized: p.authorized === 1,
    })),
  };
}

export async function prospectTotals() {
  return one<{ total: number; authorized: number }>(
    `select (select count(*) from prospects) as total,
      (select count(distinct a.prospect_id) from consents c join assessments a on a.id = c.assessment_id
        where c.consent_type = 'contacto_asesor' and c.accepted = 1) as authorized`,
  );
}

export async function prospectDetail(id: string) {
  const p = await one<{ id: string; name: string; email: string; phone: string; distributorSlug: string; createdAt: string; distributorName: string | null; distributorWhatsapp: string | null }>(
    `select p.id, p.name, p.email, p.phone, p.distributor_slug as distributorSlug, p.created_at as createdAt,
      d.display_name as distributorName, d.whatsapp as distributorWhatsapp
     from prospects p left join distributors d on d.slug = p.distributor_slug where p.id = ?`,
    [id],
  );
  if (!p) return null;
  const [assessments, history] = await Promise.all([
    rows<{ id: string; completedAt: string; snapshot: string | null; hasScan: number }>(
      `select a.id, a.completed_at as completedAt, r.snapshot,
        exists(select 1 from biometric_readings b where b.assessment_id = a.id) as hasScan
       from assessments a left join assessment_results r on r.assessment_id = a.id
       where a.prospect_id = ? order by a.completed_at desc`,
      [id],
    ),
    rows<{ status: string; changedAt: string }>(
      `select status, changed_at as changedAt from lead_status_history where prospect_id = ? order by changed_at desc`,
      [id],
    ),
  ]);
  const latest = assessments[0];
  const [consents, emails, messages] = latest
    ? await Promise.all([
        rows<{ type: string; accepted: number }>(`select consent_type as type, accepted from consents where assessment_id = ?`, [latest.id]),
        rows<{ type: string; status: string; createdAt: string }>(
          `select type, status, created_at as createdAt from email_events where assessment_id = ? order by created_at`,
          [latest.id],
        ),
        rows<{ role: string; content: string; createdAt: string }>(
          `select role, content, created_at as createdAt from assistant_messages where assessment_id = ? order by created_at`,
          [latest.id],
        ),
      ])
    : [[], [], []];
  const status = history[0]?.status;
  return {
    ...p,
    status: (isLeadStatus(status) ? status : "nuevo") as LeadStatus,
    history,
    assessments: assessments.map((a) => ({ ...a, snapshot: a.snapshot ? (JSON.parse(a.snapshot) as ResultSnapshot) : null, hasScan: a.hasScan === 1 })),
    consents: Object.fromEntries(consents.map((c) => [c.type, c.accepted === 1])) as Record<string, boolean>,
    emails,
    messages,
  };
}

// ---------- Distribuidores ----------

export async function distributorList(f: { q?: string; state?: string; sort?: string }) {
  const where: string[] = [];
  const args: string[] = [];
  if (f.q?.trim()) {
    where.push("(d.display_name like ?1 or d.email like ?1 or d.slug like ?1)");
    args.push(`%${f.q.trim()}%`);
  }
  if (f.state === "activos") where.push("d.active = 1");
  if (f.state === "inactivos") where.push("d.active = 0");
  const order = f.sort === "nombre" ? "d.display_name collate nocase" : f.sort === "recientes" ? "d.created_at desc" : "biochecks desc, d.display_name";
  return rows<{
    id: number; slug: string; displayName: string; email: string | null; whatsapp: string; storeUrl: string;
    registrationUrl: string | null; distributorId: string | null; active: number; createdAt: string; biochecks: number; contacts: number; portal: number;
  }>(
    `select d.id, d.slug, d.display_name as displayName, d.email, d.whatsapp, d.store_url as storeUrl,
      d.registration_url as registrationUrl, d.distributor_id as distributorId, d.active, d.created_at as createdAt,
      d.portal_password_hash is not null as portal,
      (select count(*) from assessments a where a.distributor_slug = d.slug and a.status = 'completed') as biochecks,
      (select count(*) from consents c join assessments a on a.id = c.assessment_id
        where a.distributor_slug = d.slug and c.consent_type = 'contacto_asesor' and c.accepted = 1) as contacts
     from distributors d ${where.length ? `where ${where.join(" and ")}` : ""} order by ${order}`,
    args,
  );
}

export const distributorOptions = () =>
  rows<{ slug: string; displayName: string }>(`select slug, display_name as displayName from distributors order by display_name collate nocase`);

// ---------- Catálogo ----------

export const catalog = () =>
  rows<{
    id: string; name: string; line: "nutriday_plus" | "club_wenow"; type: string; eyebrow: string;
    publicPrice: number; distributorPrice: number; imageUrl: string | null; active: number; recommended: number;
  }>(
    `select p.id, p.name, p.line, p.type, p.eyebrow, p.public_price as publicPrice, p.distributor_price as distributorPrice,
      p.image_url as imageUrl, p.active, (select count(*) from recommendations r where r.product_id = p.id) as recommended
     from products p order by case p.line when 'nutriday_plus' then 0 else 1 end, p.name`,
  );

// ---------- Operación ----------

export async function operations() {
  const since = periodStart("30");
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const [emails, scans, audit, celia, month] = await Promise.all([
    rows<{ status: string; n: number }>(`select status, count(*) as n from email_events where created_at >= ? group by status`, [since]),
    one<{ sessions: number; finished: number; requests: number }>(
      `select count(*) as sessions, count(finished_at) as finished, coalesce(sum(api_requests), 0) as requests from scan_sessions where created_at >= ?`,
      [since],
    ),
    rows<{ createdAt: string; actorType: string; actor: string | null; action: string; entity: string; entityId: string | null }>(
      `select l.created_at as createdAt, l.actor_type as actorType,
        coalesce(u.email, (select dd.display_name from distributors dd where l.actor_type = 'distributor' and cast(dd.id as text) = l.actor_id)) as actor,
        l.action, l.entity, l.entity_id as entityId
       from audit_logs l left join admin_users u on u.id = l.actor_id
       where l.action not in ('login_failed', 'portal_login_failed') order by l.created_at desc limit 25`,
    ),
    one<{ conversations: number; questions: number }>(
      `select count(distinct assessment_id) as conversations, sum(role = 'user') as questions from assistant_messages where created_at >= ?`,
      [since],
    ),
    // Cada sesión de escaneo con Shen.AI consume una medición del plan (500 al mes, luego se cobra por escaneo).
    one<{ n: number }>(`select count(*) as n from scan_sessions where created_at >= ?`, [monthStart]),
  ]);
  return {
    emails: Object.fromEntries(emails.map((e) => [e.status, Number(e.n)])) as Record<string, number>,
    scans: { sessions: Number(scans?.sessions ?? 0), finished: Number(scans?.finished ?? 0), requests: Number(scans?.requests ?? 0) },
    monthScans: Number(month?.n ?? 0),
    audit,
    celia: { conversations: Number(celia?.conversations ?? 0), questions: Number(celia?.questions ?? 0) },
  };
}

// ---------- Portal del distribuidor ----------

export async function distributorFunnel(slug: string, period: Period) {
  const since = periodStart(period);
  const r = await one<{ visits: number; starts: number; completed: number; authorized: number; store: number }>(
    `select
      (select count(*) from funnel_events where distributor_slug = ?1 and kind = 'visita' and created_at >= ?2) as visits,
      (select count(*) from funnel_events where distributor_slug = ?1 and kind = 'inicio' and created_at >= ?2) as starts,
      (select count(*) from assessments where distributor_slug = ?1 and status = 'completed' and completed_at >= ?2) as completed,
      (select count(*) from consents c join assessments a on a.id = c.assessment_id
        where a.distributor_slug = ?1 and c.consent_type = 'contacto_asesor' and c.accepted = 1 and a.completed_at >= ?2) as authorized,
      (select count(*) from funnel_events where distributor_slug = ?1 and kind = 'tienda' and created_at >= ?2) as store`,
    [slug, since],
  );
  return {
    visits: Number(r?.visits ?? 0), starts: Number(r?.starts ?? 0), completed: Number(r?.completed ?? 0),
    authorized: Number(r?.authorized ?? 0), store: Number(r?.store ?? 0),
  };
}

export async function statusCounts(slug: string) {
  const r = await rows<{ status: string | null; n: number }>(
    `select ${LATEST_STATUS} as status, count(*) as n from prospects p where p.distributor_slug = ? group by status`,
    [slug],
  );
  const out: Record<string, number> = {};
  for (const x of r) {
    const k = isLeadStatus(x.status) ? x.status : "nuevo";
    out[k] = (out[k] ?? 0) + Number(x.n);
  }
  return out;
}

export async function distributorNotes(prospectId: string, distributorId: number) {
  return rows<{ note: string; createdAt: string }>(
    `select note, created_at as createdAt from commercial_notes where prospect_id = ? and distributor_id = ? order by created_at desc`,
    [prospectId, distributorId],
  );
}

export async function pendingApplications() {
  return db
    .select({
      id: schema.distributorApplications.id,
      displayName: schema.distributorApplications.displayName,
      distributorNumber: schema.distributorApplications.distributorNumber,
      email: schema.distributorApplications.email,
      whatsapp: schema.distributorApplications.whatsapp,
      storeUrl: schema.distributorApplications.storeUrl,
      createdAt: schema.distributorApplications.createdAt,
    })
    .from(schema.distributorApplications)
    .where(eq(schema.distributorApplications.status, "pendiente"))
    .orderBy(desc(schema.distributorApplications.createdAt));
}
