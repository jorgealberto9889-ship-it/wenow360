import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../db/schema";
import { ENGINE_VERSION } from "../lib/engine/engine";
import { CORPORATE_DISTRIBUTOR, WENOW_PRODUCTS } from "./data/wenow-catalog";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  }),
  { schema: s },
);

type NewProduct = typeof s.products.$inferInsert;

async function main() {
  await db.transaction(async (tx) => {
    for (const product of WENOW_PRODUCTS) {
      const { highlights, ...rest } = product;
      const p: NewProduct = { active: true, ...rest, highlights };
      await tx.insert(s.products).values(p).onConflictDoUpdate({ target: s.products.id, set: p });
    }

    const stamp = new Date().toISOString();
    await tx
      .insert(s.distributors)
      .values({
        slug: CORPORATE_DISTRIBUTOR.slug, displayName: CORPORATE_DISTRIBUTOR.displayName,
        email: CORPORATE_DISTRIBUTOR.email, whatsapp: CORPORATE_DISTRIBUTOR.whatsapp,
        storeUrl: CORPORATE_DISTRIBUTOR.storeUrl, registrationUrl: CORPORATE_DISTRIBUTOR.registrationUrl,
        active: true, createdAt: stamp, updatedAt: stamp,
      })
      .onConflictDoNothing({ target: s.distributors.slug });

    await tx
      .insert(s.questionnaireVersions)
      .values({ id: "q-wenow-1.0", publishedBy: "seed", changelog: "Cuestionario WeNow 360 v1.0 (base WeNow 360 V2)." })
      .onConflictDoNothing();
    await tx
      .insert(s.recommendationRuleVersions)
      .values({ id: ENGINE_VERSION, publishedBy: "seed", changelog: "Motor WeNow 360: 15 productos NutriDay Plus / Club WeNow." })
      .onConflictDoNothing();
  });

  console.log({
    products: await db.$count(s.products),
    distributors: await db.$count(s.distributors),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
