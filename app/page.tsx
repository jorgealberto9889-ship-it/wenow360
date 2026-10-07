import { connection } from "next/server";
import { getPublicDistributor } from "@/lib/distributors";
import { assistantEnabled } from "@/lib/assistant";
import { ttsEnabled } from "@/lib/tts";
import { scanProvider } from "@/lib/scan-provider";
import { CORPORATE_SLUG } from "@/lib/submission";
import { WeNowFlow } from "./_wenow/flow";

export default async function Home() {
  // Se lee en cada visita: si el distribuidor corporativo cambia, no debe servirse una copia del build.
  await connection();
  const distributor = await getPublicDistributor(CORPORATE_SLUG);
  return <WeNowFlow distributor={distributor} scanProvider={scanProvider()} ttsEnabled={ttsEnabled()} assistantEnabled={assistantEnabled()} />;
}
