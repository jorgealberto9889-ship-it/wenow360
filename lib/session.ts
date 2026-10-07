import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "wenow_admin";
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminSession = { sub: string; role: "super_admin" | "staff" };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET falta o es demasiado corta");
  return new TextEncoder().encode(secret);
}

export async function decryptAdminSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "admin" });
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "super_admin" && payload.role !== "staff") return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export async function createAdminSession(session: AdminSession) {
  const expires = new Date(Date.now() + ADMIN_TTL_MS);
  const token = await new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setAudience("admin")
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key());
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function deleteAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
