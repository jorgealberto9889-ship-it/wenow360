import "server-only";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export const listPayments = () => db.select().from(schema.payments).orderBy(desc(schema.payments.periodKey), desc(schema.payments.createdAt));
