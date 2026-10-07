import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

const body = z.object({ slug: z.string().max(80), kind: z.enum(["visita", "inicio"]) });

// Cuenta visitas e inicios por enlace de distribuidor. No guarda IP, cookies ni datos personales.
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const [d] = await db
    .select({ slug: schema.distributors.slug })
    .from(schema.distributors)
    .where(and(eq(schema.distributors.slug, parsed.data.slug), eq(schema.distributors.active, true)));
  if (!d) return new Response(null, { status: 204 });
  await db.insert(schema.funnelEvents).values({ distributorSlug: d.slug, kind: parsed.data.kind });
  return new Response(null, { status: 204 });
}
