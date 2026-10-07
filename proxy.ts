import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Chequeo optimista: la autorización real vive en lib/dal.ts (admin) y lib/portal.ts (distribuidores).
const AREAS = {
  admin: { cookie: "wenow_admin", audience: "admin", login: "/admin/login", public: ["/admin/login"] },
  portal: { cookie: "wenow_portal", audience: "portal", login: "/portal/entrar", public: ["/portal/entrar", "/portal/recuperar", "/portal/restablecer"] },
} as const;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = pathname.startsWith("/portal") ? AREAS.portal : AREAS.admin;
  if (area.public.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const token = request.cookies.get(area.cookie)?.value;
  const secret = process.env.SESSION_SECRET;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"], audience: area.audience });
      return NextResponse.next();
    } catch {}
  }
  return NextResponse.redirect(new URL(area.login, request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
