import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { draftFromAnswers } from "@/app/_wenow/questions";
import type { ResultSnapshot, SubmitResult } from "./assessments";

// Carga un resultado guardado tal como lo vio la persona (enlace del correo y narración).
export async function loadSavedResult(assessmentId: string) {
  const [row] = await db
    .select({
      completedAt: schema.assessments.completedAt,
      distributorSlug: schema.assessments.distributorSlug,
      name: schema.prospects.name,
      snapshot: schema.assessmentResults.snapshot,
      displayName: schema.distributors.displayName,
      whatsapp: schema.distributors.whatsapp,
    })
    .from(schema.assessments)
    .innerJoin(schema.prospects, eq(schema.prospects.id, schema.assessments.prospectId))
    .innerJoin(schema.assessmentResults, eq(schema.assessmentResults.assessmentId, schema.assessments.id))
    .innerJoin(schema.distributors, eq(schema.distributors.slug, schema.assessments.distributorSlug))
    .where(eq(schema.assessments.id, assessmentId));
  if (!row?.snapshot || !row.completedAt) return null;

  const answers = await db
    .select({ questionCode: schema.assessmentAnswers.questionCode, value: schema.assessmentAnswers.value })
    .from(schema.assessmentAnswers)
    .where(eq(schema.assessmentAnswers.assessmentId, assessmentId));

  const snapshot = row.snapshot as ResultSnapshot;
  const saved: SubmitResult = {
    assessmentId,
    distributorSlug: row.distributorSlug,
    completedAt: row.completedAt,
    products: snapshot.products,
    result: snapshot.result,
  };
  return {
    saved,
    draft: draftFromAnswers(answers),
    name: row.name,
    distributor: { slug: row.distributorSlug, displayName: row.displayName, whatsapp: row.whatsapp },
  };
}
