import "server-only";
import { SignJWT, jwtVerify } from "jose";

// Enlace del correo para volver a abrir el resultado. Firmado y con vencimiento: no expone el ID en claro
// ni permite adivinar resultados de otras personas.
const LINK_TTL = "90d";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET falta o es demasiado corta");
  return new TextEncoder().encode(secret);
}

export async function signResultToken(assessmentId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(assessmentId)
    .setAudience("result")
    .setIssuedAt()
    .setExpirationTime(LINK_TTL)
    .sign(key());
}

export async function verifyResultToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "result" });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function appOrigin(requestUrl?: string) {
  return (process.env.APP_URL ?? (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000")).replace(/\/$/, "");
}
