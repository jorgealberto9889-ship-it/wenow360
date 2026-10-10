import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { CORPORATE_SLUG } from "./submission";

// Si el slug no existe o está inactivo, la sesión se atribuye al distribuidor corporativo.
export async function getPublicDistributor(slug: string) {
  const pick = (s: string) =>
    db
      .select({ slug: schema.distributors.slug, displayName: schema.distributors.displayName, whatsapp: schema.distributors.whatsapp })
      .from(schema.distributors)
      .where(and(eq(schema.distributors.slug, s), eq(schema.distributors.active, true)))
      .limit(1);
  const [found] = await pick(slug.toLowerCase());
  if (found) return found;
  const [corporate] = await pick(CORPORATE_SLUG);
  if (!corporate) throw new Error("Falta el distribuidor corporativo 'wenow'");
  return corporate;
}
