import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

// Winnie en la portada responde sin conocer a la persona, así que no hay evaluación a la cual atarla.
// Para controlar el costo del modelo se limitan las preguntas por visitante y en total, por día.
const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const VISITOR_DAILY = () => num(process.env.WINNIE_VISITOR_DAILY, 20);
const GLOBAL_DAILY = () => num(process.env.WINNIE_GLOBAL_DAILY, 1500);

async function bump(key: string) {
  const [row] = await db
    .insert(schema.winnieUsage)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: schema.winnieUsage.key,
      set: { count: sql`${schema.winnieUsage.count} + 1`, updatedAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')` },
    })
    .returning({ count: schema.winnieUsage.count });
  return row.count;
}

// Huella del visitante: hash de la IP con el secreto de la app; nunca se guarda la IP.
const fingerprint = (ip: string) => createHash("sha256").update(`${process.env.SESSION_SECRET}|${ip}`).digest("hex").slice(0, 24);

export async function takeWinnieTurn(ip: string): Promise<"ok" | "visitor" | "global"> {
  const day = new Date().toISOString().slice(0, 10);
  if ((await bump(`v:${day}:${fingerprint(ip)}`)) > VISITOR_DAILY()) return "visitor";
  if ((await bump(`g:${day}`)) > GLOBAL_DAILY()) return "global";
  return "ok";
}
