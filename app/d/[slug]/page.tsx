import { getPublicDistributor } from "@/lib/distributors";
import { assistantEnabled } from "@/lib/assistant";
import { ttsEnabled } from "@/lib/tts";
import { scanProvider } from "@/lib/scan-provider";
import { WeNowFlow } from "../../_wenow/flow";

export default async function DistributorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const distributor = await getPublicDistributor(slug);
  return <WeNowFlow distributor={distributor} scanProvider={scanProvider()} ttsEnabled={ttsEnabled()} assistantEnabled={assistantEnabled()} />;
}
