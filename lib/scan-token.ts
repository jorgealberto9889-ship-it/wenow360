import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { BiometricInput } from "./engine/biometrics";

// El navegador nunca envía números de frecuencia: recibe este token firmado por el servidor
// al terminar el escaneo y lo devuelve junto con el cuestionario.
const SCAN_TTL = "2h";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET falta o es demasiado corta");
  return new TextEncoder().encode(secret);
}

export async function signScanToken(reading: BiometricInput) {
  return new SignJWT({
    hr: reading.heartRateBpm, rr: reading.respiratoryRateBpm,
    sd: reading.hrvSdnnMs ?? null, ln: reading.hrvLnrmssdMs ?? null,
    st: reading.stressIndex ?? null, ps: reading.parasympatheticActivity ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("biometric-scan")
    .setIssuedAt()
    .setExpirationTime(SCAN_TTL)
    .sign(key());
}

export async function verifyScanToken(token: string): Promise<BiometricInput | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "biometric-scan" });
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const reading: BiometricInput = {
      heartRateBpm: num(payload.hr), respiratoryRateBpm: num(payload.rr),
      hrvSdnnMs: num(payload.sd), hrvLnrmssdMs: num(payload.ln), stressIndex: num(payload.st), parasympatheticActivity: num(payload.ps),
    };
    return Object.values(reading).every((v) => v === null) ? null : reading;
  } catch {
    return null;
  }
}
