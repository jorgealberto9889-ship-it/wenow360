// Proveedor del escaneo facial. Se elige con SCAN_PROVIDER ("shenai" o "vitallens"; por omisión, VitalLens).
// El resto de WeNow 360 solo recibe el token firmado de la lectura, así que cambiar de proveedor no toca nada más.
export type ScanProvider = "shenai" | "vitallens";

export function scanProvider(): ScanProvider | null {
  const wanted = process.env.SCAN_PROVIDER === "shenai" ? "shenai" : "vitallens";
  if (wanted === "shenai") return process.env.SHENAI_ADMIN_KEY ? "shenai" : null;
  return process.env.VITALLENS_API_KEY ? "vitallens" : null;
}

export const scanEnabled = () => scanProvider() !== null;

// Nombre que se muestra al cliente (aviso de privacidad y pantalla del escaneo) y en el admin.
export const SCAN_PROVIDER_LABEL: Record<ScanProvider, string> = {
  shenai: "Shen.AI",
  vitallens: "VitalLens, de Rouast Labs",
};
