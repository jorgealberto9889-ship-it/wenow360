import { z } from "zod";
import { db, schema } from "@/db";
import { askGemini, assistantEnabled, history, MAX_MESSAGE_CHARS, MAX_QUESTIONS, questionsAsked, systemPrompt } from "@/lib/assistant";
import { verifyResultToken } from "@/lib/result-link";
import { loadSavedResult } from "@/lib/saved-result";

const bodySchema = z.object({
  token: z.string().max(2000),
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

// Solo responde a quien tiene el enlace firmado de su resultado; el historial vive en el servidor.
export async function POST(request: Request) {
  if (!assistantEnabled()) return Response.json({ error: "Asistente no disponible." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Escribe tu pregunta (máximo 500 caracteres)." }, { status: 422 });

  const assessmentId = await verifyResultToken(parsed.data.token);
  const data = assessmentId ? await loadSavedResult(assessmentId) : null;
  if (!assessmentId || !data) return Response.json({ error: "Tu sesión venció. Vuelve a abrir tu resultado." }, { status: 403 });

  if ((await questionsAsked(assessmentId)) >= MAX_QUESTIONS) {
    return Response.json(
      { error: `Llegaste al límite de preguntas. ${data.distributor.displayName} puede seguir ayudándote por WhatsApp.` },
      { status: 429 },
    );
  }

  const turns = [...(await history(assessmentId)), { role: "user" as const, content: parsed.data.message }];
  try {
    const answer = await askGemini(await systemPrompt(data.saved, data.name, data.distributor.displayName, turns.map((t) => t.content).join(" ")), turns);
    await db.insert(schema.assistantMessages).values({ assessmentId, role: "user", content: parsed.data.message });
    const [saved] = await db
      .insert(schema.assistantMessages)
      .values({ assessmentId, role: "model", content: answer })
      .returning({ id: schema.assistantMessages.id });
    return Response.json({ answer, id: saved.id });
  } catch (e) {
    console.error("assistant_failed", { message: (e as Error).message });
    return Response.json(
      { error: `No pude responder en este momento. Intenta de nuevo o escribe a ${data.distributor.displayName} por WhatsApp.` },
      { status: 502 },
    );
  }
}
