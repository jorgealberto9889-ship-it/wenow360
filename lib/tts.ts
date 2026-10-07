import "server-only";

export const ttsEnabled = () => Boolean(process.env.GOOGLE_TTS_API_KEY);

export const NARRATOR_VOICE = () => process.env.GOOGLE_TTS_VOICE ?? "es-US-Wavenet-B";
export const ASSISTANT_VOICE = () => process.env.ASSISTANT_TTS_VOICE ?? "es-US-Wavenet-A";

// Google Cloud Text-to-Speech (REST). La clave debe estar restringida a esta API en Google Cloud.
// Las voces Chirp 3 HD no aceptan SSML: para ellas se envía el texto plano.
export async function synthesize(input: { ssml: string; text: string }, voice = NARRATOR_VOICE()): Promise<Buffer> {
  const chirp = voice.includes("Chirp");
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_TTS_API_KEY! },
    body: JSON.stringify({
      input: chirp ? { text: input.text } : { ssml: input.ssml },
      voice: { languageCode: "es-US", name: voice },
      audioConfig: { audioEncoding: "MP3", ...(chirp ? {} : { speakingRate: 0.97 }) },
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`Google TTS ${res.status}: ${String(body?.error?.message ?? "").slice(0, 200)}`);
  }
  const { audioContent } = (await res.json()) as { audioContent: string };
  return Buffer.from(audioContent, "base64");
}

const xml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const tidy = (p: string) =>
  p.replace(/—/g, ",").replace(/[«»*_#]/g, "").replace(/®/g, "").replace(/\$1(?![\d,])/g, "un peso").replace(/\$(\d[\d,]*)/g, "$1 pesos");

export function speechInput(paragraphs: string[]) {
  const clean = paragraphs.map(tidy).filter(Boolean);
  return {
    ssml: `<speak>${clean.map((p) => `<p>${xml(p)}</p>`).join('<break time="350ms"/>')}</speak>`,
    text: clean.join("\n\n"),
  };
}
