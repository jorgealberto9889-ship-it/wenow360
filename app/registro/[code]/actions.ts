"use server";

import { publicOrigin } from "@/lib/admin/origin";
import { applicationSchema, createApplication, isValidRegistrationCode } from "@/lib/registration";

export type RegistrationState = { error?: string; ok?: boolean } | undefined;

export async function submitApplication(code: string, _: RegistrationState, formData: FormData): Promise<RegistrationState> {
  if (!(await isValidRegistrationCode(code))) return { error: "Este enlace de registro no es válido. Pídele a WeNow uno nuevo." };
  // Campo trampa: las personas no lo ven; los bots suelen llenarlo.
  if (formData.get("website")) return { ok: true };
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };
  const result = await createApplication(parsed.data, await publicOrigin());
  return result.ok ? { ok: true } : { error: result.error };
}
