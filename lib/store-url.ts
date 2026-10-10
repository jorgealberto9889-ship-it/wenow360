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

// Página de cada producto en la tienda de WeNow (store.wenow.global/mx/products/<handle>). NutriDay Red y Brown comparten
// página (los sabores se eligen ahí).
export const STORE_HANDLES: Record<string, string> = {
  "green-plus": "greenplus", purebody: "purebody", "active-burn": "activeburn", "nutriday-red": "nutriday", "nutriday-brown": "nutriday",
  antiox: "antiox", regenerex: "regenerex", resnad: "resnad", "nk-plus": "nkplus", transfactor: "transfactor",
  "neuro-chai": "neuro", "collagen-woman": "collagen-woman", "collagen-man": "collagen-man", synergy: "synergy", endo: "endo",
};

// Enlace al producto conservando lo que identifica al distribuidor. Parte de su enlace de referido:
// - si ya apunta a una página de producto (/mx/products/<handle>), cambia solo el producto y conserva el resto (p. ej. ?ref=…);
// - si apunta a la raíz de la tienda, agrega /mx/products/<handle> y conserva los parámetros;
// - si el formato es otro (por ejemplo la identificación va en la ruta), no se arriesga: devuelve su enlace tal cual.
export function productStoreUrl(productId: string, referralUrl: string): string {
  const handle = STORE_HANDLES[productId];
  if (!handle) return referralUrl;
  let u: URL;
  try {
    u = new URL(referralUrl);
  } catch {
    return referralUrl;
  }
  const m = /^(\/[a-z]{2})\/products\/[^/]+\/?$/i.exec(u.pathname);
  if (m) u.pathname = `${m[1]}/products/${handle}`;
  else if (/^\/([a-z]{2}\/?)?$/i.test(u.pathname)) u.pathname = `${u.pathname.replace(/\/$/, "") || "/mx"}/products/${handle}`;
  else return referralUrl;
  return u.toString();
}
