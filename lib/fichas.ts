// Fichas técnicas en PDF publicadas en /fichas/<id>.pdf (una por producto; Red y Brown comparten archivo).
const PDF_FICHAS = new Set([
  "active-burn", "antiox", "collagen-man", "collagen-woman", "endo", "green-plus", "neuro-chai",
  "nk-plus", "nutriday-red", "nutriday-brown", "purebody", "regenerex", "resnad", "synergy", "transfactor",
]);

export const fichaPdfUrl = (productId: string) => (PDF_FICHAS.has(productId) ? `/fichas/${productId}.pdf` : null);
