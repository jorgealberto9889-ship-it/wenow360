import { z } from "zod";
import { askGemini, assistantEnabled, MAX_MESSAGE_CHARS, publicSystemPrompt } from "@/lib/assistant";
import { getPublicDistributor } from "@/lib/distributors";
import { takeWinnieTurn } from "@/lib/winnie-public";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  // El historial viaja desde el navegador: no se guarda nada en el servidor.
  history: z.array(z.object({ role: z.enum(["user", "model"]), content: z.string().max(2000) })).max(8).default([]),
  distributor: z.string().max(80).default(""),
});

// Chat público de Winnie en la portada. No recibe ni guarda datos personales ni conversaciones.
export async function POST(request: Request) {
  if (!assistantEnabled()) return Response.json({ error: "Winnie no está disponible por ahora." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Escribe tu pregunta (máximo 500 caracteres)." }, { status: 422 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const turn = await takeWinnieTurn(ip);
  if (turn !== "ok") {
    return Response.json(
      {
        error:
          turn === "visitor"
            ? "Llegaste al límite de preguntas de hoy. Haz tu evaluación gratuita o escríbele a tu asesor por WhatsApp para seguir."
            : "Winnie está recibiendo muchas preguntas en este momento. Intenta de nuevo más tarde o escríbele a tu asesor por WhatsApp.",
      },
      { status: 429 },
    );
  }

  const distributor = await getPublicDistributor(parsed.data.distributor || "wenow");
  // El modelo exige empezar con el usuario y alternar turnos: se descarta lo que no encaje (p. ej. una respuesta con error).
  const turns: { role: "user" | "model"; content: string }[] = [];
  for (const t of [...parsed.data.history, { role: "user" as const, content: parsed.data.message }]) {
    const last = turns.at(-1);
    if (!last && t.role === "model") continue;
    if (last?.role === t.role) last.content += `\n${t.content}`;
    else turns.push({ ...t });
  }
  try {
    const answer = await askGemini(await publicSystemPrompt(distributor.displayName, turns.map((t) => t.content).join(" ")), turns, "winnie_publico");
    return Response.json({ answer });
  } catch (e) {
    console.error("winnie_public_failed", { message: (e as Error).message });
    return Response.json({ error: "No pude responder en este momento. Intenta de nuevo en un momento." }, { status: 502 });
  }
}
