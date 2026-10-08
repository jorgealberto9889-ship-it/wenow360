import { notFound } from "next/navigation";
import { describeBiometrics } from "@/lib/engine/biometrics";
import { ClinicalPanel } from "@/app/_wenow/clinical-panel";

// Vista de diseño del panel de mediciones con valores de ejemplo. Solo existe en desarrollo.
export const dynamic = "force-dynamic";

const SAMPLES = {
  completo: { heartRateBpm: 72, respiratoryRateBpm: 16, hrvSdnnMs: 54, hrvLnrmssdMs: 3.9, stressIndex: 3.2, parasympatheticActivity: 58, hrSeries: [71, 72, 74, 73, 71, 70, 72, 75, 74, 72, 71, 70, 69, 71, 73, 74, 72, 71, 70, 72, 73, 72, 71, 72] },
  alto: { heartRateBpm: 104, respiratoryRateBpm: 22, hrvSdnnMs: 24, hrvLnrmssdMs: 2.7, stressIndex: 9.3, parasympatheticActivity: 22 },
  parcial: { heartRateBpm: 66, respiratoryRateBpm: null, hrvSdnnMs: null, hrvLnrmssdMs: null, stressIndex: 6.1, parasympatheticActivity: null },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ caso?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { caso } = await searchParams;
  const sample = SAMPLES[(caso as keyof typeof SAMPLES) ?? "completo"] ?? SAMPLES.completo;
  const bio = describeBiometrics(sample)!;
  return <ClinicalPanel bio={bio} completedAt={new Date().toISOString()} />;
}
