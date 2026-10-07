import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyResultToken } from "@/lib/result-link";
import { distributorStoreUrl } from "@/lib/store";

// Lleva a la tienda del asesor que atendió la evaluación y registra el clic en el embudo.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assessmentId = await verifyResultToken(token);
  if (!assessmentId) return new Response("Enlace no válido", { status: 404 });

  const [row] = await db
    .select({ slug: schema.assessments.distributorSlug, storeUrl: schema.distributors.storeUrl })
    .from(schema.assessments)
    .innerJoin(schema.distributors, eq(schema.distributors.slug, schema.assessments.distributorSlug))
    .where(eq(schema.assessments.id, assessmentId));
  if (!row) return new Response("Resultado no encontrado", { status: 404 });

  await db.insert(schema.funnelEvents).values({ distributorSlug: row.slug, kind: "tienda" });
  return Response.redirect(distributorStoreUrl(row.slug, row.storeUrl), 302);
}
