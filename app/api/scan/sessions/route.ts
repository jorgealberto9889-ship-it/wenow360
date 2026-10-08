import { scanProvider } from "@/lib/scan-provider";
import { mintShenaiToken } from "@/lib/shenai";
import { createScanSession, scansToday } from "@/lib/vitallens";

// Abre una sesión de escaneo. Con Shen.AI también entrega el token temporal de una sola medición.
export async function POST() {
  const provider = scanProvider();
  if (!provider) return Response.json({ error: "Escaneo no disponible." }, { status: 404 });
  // Tope diario opcional (SCAN_DAILY_MAX): cada medición de Shen.AI pasado el plan mensual tiene costo.
  const dailyMax = Number(process.env.SCAN_DAILY_MAX);
  if (dailyMax > 0 && (await scansToday()) >= dailyMax) {
    return Response.json({ error: "El escaneo no está disponible por hoy. Puedes continuar sin este paso." }, { status: 429 });
  }
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
