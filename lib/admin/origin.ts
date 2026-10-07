import "server-only";
import { headers } from "next/headers";

// Dominio público para armar enlaces que se copian (APP_URL cuando exista el dominio propio).
export async function publicOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}
