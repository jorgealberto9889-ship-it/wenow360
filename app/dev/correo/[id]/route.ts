import { buildAdvisorEmail, buildCorporateEmail, buildResultEmail, loadContext, resultUrlFor } from "@/lib/email";
import { buildCheckin, buildKitReminder, signUnsubscribeToken } from "@/lib/follow-ups";

// Solo en desarrollo: vista previa de los correos sin enviarlos. En producción responde 404.
// ?tipo=resultado (default) | asesor | corporativo | recordatorio | seguimiento
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return new Response("No encontrado", { status: 404 });
  const { id } = await params;
  const ctx = await loadContext(id);
  if (!ctx) return new Response("No encontrado", { status: 404 });
  const url = new URL(request.url);
  const resultUrl = await resultUrlFor(id, url.origin);
  const unsubscribeUrl = `${url.origin}/baja/${await signUnsubscribeToken(id)}`;
  const tipo = url.searchParams.get("tipo");
  const email =
    tipo === "asesor" ? buildAdvisorEmail(ctx, { portal: `${url.origin}/portal/prospecto/${ctx.prospectId}` })
    : tipo === "corporativo" ? buildCorporateEmail(ctx, { admin: `${url.origin}/admin/prospectos/${ctx.prospectId}`, distributorLink: `${url.origin}/d/${ctx.distributorSlug}` }, 4)
    : tipo === "recordatorio" ? buildKitReminder(ctx, resultUrl, unsubscribeUrl)
    : tipo === "seguimiento" ? buildCheckin(ctx, resultUrl, unsubscribeUrl)
    : buildResultEmail(ctx, resultUrl);
  return new Response(email.html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
