import "server-only";
import { BRAND } from "./brand";

// Tienda de WeNow. PENDIENTE: WeNow confirma la plataforma de compra (back office del Club). Mientras
// tanto cada distribuidor tiene su propia URL de tienda (distributors.storeUrl) y, sin ella, se usa
// el sitio de la marca. La compra con el asesor y el kit se coordinan por WhatsApp.
const STORE_URL = (process.env.STORE_URL || BRAND.website).replace(/\/$/, "");

// Enlace de la tienda a nombre de un distribuidor.
export const distributorStoreUrl = (slug: string, storeUrl?: string | null) => {
  const base = (storeUrl || STORE_URL).replace(/\/$/, "");
  return `${base}${base.includes("?") ? "&" : "/?"}asesor=${encodeURIComponent(slug)}`;
};
