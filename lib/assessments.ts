import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { calculateResult, ENGINE_VERSION, type EngineResult } from "./engine/engine";
import { verifyScanToken } from "./scan-token";
import { CONSENT_TEXT_VERSION, CORPORATE_SLUG, type Submission } from "./submission";

export const QUESTIONNAIRE_VERSION = "q-wenow-1.0";

export type ResultProduct = Pick<
  typeof schema.products.$inferSelect,
  "id" | "line" | "type" | "name" | "eyebrow" | "ingredients" | "ingredientSupport" | "usage" | "note" | "publicPrice" | "distributorPrice" | "imageUrl" | "highlights"
>;

export type ResultSnapshot = { result: EngineResult; products: ResultProduct[] };

export type SubmitResult = {
  assessmentId: string;
  // Enlace firmado del resultado; lo usa la narración con voz.
  resultToken?: string;
  products: ResultProduct[];
  distributorSlug: string;
  completedAt: string;
  result: EngineResult;
};

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

async function resolveDistributorSlug(requested: string) {
  const [found] = await db
    .select({ slug: schema.distributors.slug })
    .from(schema.distributors)
    .where(and(eq(schema.distributors.slug, requested), eq(schema.distributors.active, true)));
  return found?.slug ?? CORPORATE_SLUG;
}

export async function submitAssessment(input: Submission): Promise<SubmitResult> {
  const [distributorSlug, catalog, biometric] = await Promise.all([
    resolveDistributorSlug(input.distributorSlug),
    db
      .select({ id: schema.products.id, type: schema.products.type, active: schema.products.active, goals: schema.products.goals })
      .from(schema.products),
    input.scanToken ? verifyScanToken(input.scanToken) : Promise.resolve(null),
  ]);

  const result = calculateResult(input.answers, catalog, biometric);
  const completedAt = new Date().toISOString();

  const ids = result.recommendations.map((r) => r.productId);
  const rows = ids.length
    ? await db
        .select({
          id: schema.products.id, line: schema.products.line, type: schema.products.type, name: schema.products.name,
          eyebrow: schema.products.eyebrow, ingredients: schema.products.ingredients,
          ingredientSupport: schema.products.ingredientSupport, usage: schema.products.usage, note: schema.products.note,
          publicPrice: schema.products.publicPrice, distributorPrice: schema.products.distributorPrice,
          imageUrl: schema.products.imageUrl, highlights: schema.products.highlights,
        })
        .from(schema.products)
        .where(inArray(schema.products.id, ids))
    : [];
  const products = ids.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);

  const assessmentId = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: schema.prospects.id })
      .from(schema.prospects)
      .where(eq(schema.prospects.email, input.contact.email))
      .orderBy(desc(schema.prospects.createdAt))
      .limit(1);

    let prospectId = existing?.id;
    if (prospectId) {
      await tx
        .update(schema.prospects)
        .set({ name: input.contact.name, phone: input.contact.phone, distributorSlug })
        .where(eq(schema.prospects.id, prospectId));
    } else {
      [{ id: prospectId }] = await tx
        .insert(schema.prospects)
        .values({ ...input.contact, distributorSlug })
        .returning({ id: schema.prospects.id });
      await tx.insert(schema.leadStatusHistory).values({ prospectId, status: "nuevo" });
    }

    const [{ id }] = await tx
      .insert(schema.assessments)
      .values({ prospectId, distributorSlug, questionnaireVersion: QUESTIONNAIRE_VERSION, status: "completed", completedAt })
      .returning({ id: schema.assessments.id });

    await tx.insert(schema.assessmentAnswers).values(
      Object.entries(input.answers)
        .filter(([, value]) => value !== null)
        .map(([code, value]) => ({ assessmentId: id, questionCode: snake(code), value })),
    );

    const [{ id: resultId }] = await tx
      .insert(schema.assessmentResults)
      .values({
        assessmentId: id,
        engineVersion: ENGINE_VERSION,
        areas: result.areas,
        analysisSummary: result.analysisSummary,
        medicalAttention: result.medicalAttention,
        habits: result.habits,
        stopped: result.stopped,
        snapshot: { result, products } satisfies ResultSnapshot,
      })
      .returning({ id: schema.assessmentResults.id });

    if (result.recommendations.length > 0) {
      await tx.insert(schema.recommendations).values(
        result.recommendations.map((r) => ({ assessmentResultId: resultId, ...r })),
      );
    }

    if (biometric) {
      const shenai = [biometric.hrvSdnnMs, biometric.hrvLnrmssdMs, biometric.stressIndex, biometric.parasympatheticActivity].some((v) => v != null);
      await tx.insert(schema.biometricReadings).values({ assessmentId: id, provider: shenai ? "shenai" : "vitallens", ...biometric });
    }

    const consent = (consentType: typeof schema.consents.$inferInsert.consentType, accepted: boolean) => ({
      assessmentId: id, consentType, accepted, textVersion: CONSENT_TEXT_VERSION,
    });
    await tx.insert(schema.consents).values([
      consent("evaluacion", input.consents.privacy),
      consent("datos_sensibles", input.consents.sensitiveData),
      consent("contacto_asesor", input.consents.advisorContact),
      consent("marketing", input.consents.marketing),
      ...(biometric ? [consent("escaneo_biometrico", true)] : []),
    ]);

    await tx.insert(schema.auditLogs).values({
      actorType: "system", action: "assessment_completed", entity: "assessments", entityId: id,
    });
    return id;
  });

  return {
    assessmentId,
    products,
    distributorSlug,
    completedAt,
    result,
  };
}

