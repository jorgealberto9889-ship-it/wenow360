import { isNarrationSection, narrationParagraphs } from "@/lib/narration";
import { verifyResultToken } from "@/lib/result-link";
import { loadSavedResult } from "@/lib/saved-result";
import { speechInput, synthesize, ttsEnabled } from "@/lib/tts";

// Solo narra el resultado guardado de quien tiene el enlace firmado: nunca texto arbitrario.
export async function GET(_: Request, { params }: { params: Promise<{ token: string; section: string }> }) {
  const { token, section } = await params;
  if (!ttsEnabled()) return new Response("No encontrado", { status: 404 });
  const assessmentId = await verifyResultToken(token);
  const data = assessmentId ? await loadSavedResult(assessmentId) : null;
  if (!data || !isNarrationSection(section, data.saved)) return new Response("No encontrado", { status: 404 });

  const paragraphs = narrationParagraphs(section, data.saved, data.draft, data.name, data.distributor.displayName);
  if (paragraphs.length === 0) return new Response("No encontrado", { status: 404 });

  try {
    const audio = await synthesize(speechInput(paragraphs));
    return new Response(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch (e) {
    console.error("tts_failed", { message: (e as Error).message });
    return new Response("No disponible", { status: 502 });
  }
}
