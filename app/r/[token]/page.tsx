import type { Metadata } from "next";
import Link from "next/link";
import { verifyResultToken } from "@/lib/result-link";
import { loadSavedResult } from "@/lib/saved-result";
import { assistantEnabled } from "@/lib/assistant";
import { ttsEnabled } from "@/lib/tts";
import { Result } from "../../_wenow/result";

export const metadata: Metadata = {
  title: "Tu resultado · WeNow 360",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SavedResult({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assessmentId = await verifyResultToken(token);
  const data = assessmentId ? await loadSavedResult(assessmentId) : null;

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5">
        <h1 className="text-[23px] font-extrabold text-[var(--navy)]">Este enlace ya no está disponible</h1>
        <p className="mt-2 text-[14px] leading-normal text-[var(--muted)]">
          Los enlaces de resultado vencen por seguridad. Puedes hacer tu WeNow 360 de nuevo; toma unos 3 minutos.
        </p>
        <Link href="/" className="press mt-6 rounded-full bg-[var(--blue)] py-4 text-center text-[15px] font-bold text-white">
          Hacer mi WeNow 360
        </Link>
      </main>
    );
  }

  return <Result saved={data.saved} draft={data.draft} name={data.name} distributor={data.distributor} narrationToken={ttsEnabled() ? token : null} assistantToken={assistantEnabled() ? token : null} storeToken={token} />;
}
