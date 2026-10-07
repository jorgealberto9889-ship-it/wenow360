import type { NextConfig } from "next";

// Shen.AI (escaneo facial) usa SharedArrayBuffer, que el navegador solo permite con aislamiento entre
// orígenes. Se activa únicamente con ese proveedor y en las páginas donde corre el WeNow 360.
const crossOriginIsolation = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.SCAN_PROVIDER !== "shenai") return [];
    return [
      { source: "/", headers: crossOriginIsolation },
      { source: "/d/:slug", headers: crossOriginIsolation },
      // Los workers de la librería también deben declarar el aislamiento.
      { source: "/vendor/shenai/:path*", headers: [...crossOriginIsolation, { key: "Cross-Origin-Resource-Policy", value: "same-origin" }] },
    ];
  },
};

export default nextConfig;
