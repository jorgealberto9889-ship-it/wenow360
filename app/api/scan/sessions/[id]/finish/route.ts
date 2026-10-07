import { z } from "zod";
import { scanEnabled } from "@/lib/scan-provider";
import { finishScanSession } from "@/lib/vitallens";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const num = z.number().finite().nullable();
const readingSchema = z.object({
  heartRateBpm: num,
  heartRateConfidence: num,
  respiratoryRateBpm: num,
  respiratoryRateConfidence: num,
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!scanEnabled() || !UUID.test(id)) return Response.json({ ok: false, reason: "invalid_session" }, { status: 404 });
  const parsed = readingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, reason: "invalid_reading" }, { status: 422 });
  const result = await finishScanSession(id, parsed.data);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
