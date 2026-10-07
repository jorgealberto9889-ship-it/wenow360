import { scanProvider } from "@/lib/scan-provider";
import { proxyToVitalLens } from "@/lib/vitallens";

// Proxy para vitallens.js: la clave de la API se agrega aquí y nunca llega al navegador.
// Rutas que usa la librería con `proxyUrl`: GET /resolve-model, POST /file, POST /stream.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type Params = { params: Promise<{ session: string; op: string }> };

async function handle(request: Request, { params }: Params, allowed: readonly string[]) {
  const { session, op } = await params;
  if (scanProvider() !== "vitallens" || !UUID.test(session) || !allowed.includes(op)) {
    return Response.json({ message: "No encontrado." }, { status: 404 });
  }
  return proxyToVitalLens(session, op as "resolve-model" | "file" | "stream", request);
}

export function GET(request: Request, ctx: Params) {
  return handle(request, ctx, ["resolve-model"]);
}

export function POST(request: Request, ctx: Params) {
  return handle(request, ctx, ["file", "stream"]);
}
