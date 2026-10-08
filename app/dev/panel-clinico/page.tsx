import { notFound } from "next/navigation";
import { describeBiometrics } from "@/lib/engine/biometrics";
import { ClinicalPanel } from "@/app/_wenow/clinical-panel";

// Vista de diseño del panel de mediciones con valores de ejemplo. Solo existe en desarrollo.
export const dynamic = "force-dynamic";

const SAMPLES = {
  completo: { heartRateBpm: 72, respiratoryRateBpm: 16, hrvSdnnMs: 54, hrvLnrmssdMs: 3.9, stressIndex: 3.2, parasympatheticActivity: 58 },
  alto: { heartRateBpm: 104, respiratoryRateBpm: 22, hrvSdnnMs: 24, hrvLnrmssdMs: 2.7, stressIndex: 9.3, parasympatheticActivity: 22 },
  parcial: { heartRateBpm: 66, respiratoryRateBpm: null, hrvSdnnMs: null, hrvLnrmssdMs: null, stressIndex: 6.1, parasympatheticActivity: null },
} as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ caso?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { caso } = await searchParams;
  const sample = SAMPLES[(caso as keyof typeof SAMPLES) ?? "completo"] ?? SAMPLES.completo;
  const bio = describeBiometrics(sample)!;
  return <ClinicalPanel bio={bio} completedAt={new Date().toISOString()} code="9f3a1c2e-0000-0000-0000-000000000000" />;
}
