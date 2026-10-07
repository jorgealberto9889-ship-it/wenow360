import { buildLaunchEmail } from "@/lib/launch-email";

// Solo en desarrollo: vista previa del correo de lanzamiento. En producción responde 404.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("No encontrado", { status: 404 });
  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  const { html } = buildLaunchEmail({
    name: "Fernanda Navarro Esquivel", origin, distributorLink: `${origin}/d/fernanda-navarro-esquivel-163`, activateUrl: `${origin}/portal/restablecer/ejemplo`,
  });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
