// Enlace de referido de la tienda de WeNow. Solo se aceptan direcciones https de wenow.global: el sistema redirige a
// este enlace desde «Comprar ahora», así que no se permiten dominios ajenos.
export type StoreUrlResult = { ok: true; url: string } | { ok: false; error: string };

export function parseStoreUrl(raw: string): StoreUrlResult {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Escribe tu enlace de referido de la tienda de WeNow." };
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return { ok: false, error: "El enlace de la tienda no es válido. Cópialo completo, empezando con https://" };
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || !(host === "wenow.global" || host.endsWith(".wenow.global"))) {
    return { ok: false, error: "El enlace debe ser de la tienda de WeNow (https://store.wenow.global/…)." };
  }
  return { ok: true, url: u.toString().slice(0, 500) };
}
