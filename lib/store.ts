import "server-only";

// Tienda de WeNow. PENDIENTE: WeNow confirma la plataforma de compra (back office del Club). Mientras
// tanto cada distribuidor tiene su propia URL de tienda (distributors.storeUrl) y, sin ella, se usa
// el sitio de la marca. La compra con el asesor y el kit se coordinan por WhatsApp.
const STORE_URL = process.env.STORE_URL || "https://store.wenow.global/mx/products/paquete-de-lanzamiento";

// Enlace de la tienda de un distribuidor: su enlace de referido tal cual (ya lleva su identificación en la tienda). Sin
// enlace propio se usa el general de WeNow. `BRAND` y el slug se conservan por compatibilidad con quien lo llama.
export const distributorStoreUrl = (_slug: string, storeUrl?: string | null) => storeUrl || STORE_URL;
