import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { winnieGreeting, quickAnswers } from "@/app/_wenow/winnie";
import { verifyResultToken } from "@/lib/result-link";
import { loadSavedResult } from "@/lib/saved-result";
import { ASSISTANT_VOICE, speechInput, synthesize, ttsEnabled } from "@/lib/tts";

// Voz de Winnie. Solo lee textos que ya existen para esa evaluación: su saludo, las respuestas
// rápidas y sus propias respuestas guardadas. Nunca texto enviado por el navegador.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!ttsEnabled()) return new Response("No encontrado", { status: 404 });
  const { token } = await params;
  const assessmentId = await verifyResultToken(token);
  const data = assessmentId ? await loadSavedResult(assessmentId) : null;
  if (!assessmentId || !data) return new Response("No encontrado", { status: 404 });

  const q = new URL(request.url).searchParams;
  let text: string | null = null;
  if (q.get("g") === "1") {
    text = winnieGreeting(data.name);
  } else if (q.has("q")) {
    text = quickAnswers(data.saved, data.distributor.displayName)[Number(q.get("q"))]?.a ?? null;
  } else if (q.has("m")) {
    const [row] = await db
      .select({ content: schema.assistantMessages.content })
      .from(schema.assistantMessages)
      .where(and(eq(schema.assistantMessages.id, q.get("m")!), eq(schema.assistantMessages.assessmentId, assessmentId), eq(schema.assistantMessages.role, "model")));
    text = row?.content ?? null;
  }
  if (!text) return new Response("No encontrado", { status: 404 });

  try {
    const audio = await synthesize(speechInput(text.split(/\n+/)), ASSISTANT_VOICE());
    return new Response(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" } });
  } catch (e) {
    console.error("celia_tts_failed", { message: (e as Error).message });
    return new Response("No disponible", { status: 502 });
  }
}
