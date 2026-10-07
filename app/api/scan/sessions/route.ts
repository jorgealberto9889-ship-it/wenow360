import { scanProvider } from "@/lib/scan-provider";
import { mintShenaiToken } from "@/lib/shenai";
import { createScanSession } from "@/lib/vitallens";

// Abre una sesión de escaneo. Con Shen.AI también entrega el token temporal de una sola medición.
export async function POST() {
  const provider = scanProvider();
  if (!provider) return Response.json({ error: "Escaneo no disponible." }, { status: 404 });
  let token: string | undefined;
  if (provider === "shenai") {
    try {
      token = await mintShenaiToken();
    } catch (e) {
      console.error("shenai: no se pudo emitir el token", e instanceof Error ? e.message : e);
      return Response.json({ error: "Escaneo no disponible." }, { status: 503 });
    }
  }
  return Response.json({ sessionId: await createScanSession(), provider, token }, { status: 201 });
}
