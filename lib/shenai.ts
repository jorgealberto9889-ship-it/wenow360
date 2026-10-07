import "server-only";

// Shen.AI mide en el dispositivo (WASM). La clave de administrador nunca llega al navegador: por cada
// escaneo se emite un token temporal que sirve para una sola medición.
const TOKEN_URL = "https://api.shen.ai/v1/token";
const TOKEN_TTL_SECONDS = 10 * 60;

export async function mintShenaiToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.SHENAI_ADMIN_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ expires_in: TOKEN_TTL_SECONDS, single_device: true, max_measurements: 1 }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`shenai_token_${res.status}`);
  const { token } = (await res.json()) as { token?: string };
  if (!token) throw new Error("shenai_token_vacio");
  return token;
}
