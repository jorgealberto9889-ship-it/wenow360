// Sirve las librerías de escaneo facial como archivos estáticos en vez de empaquetarlas:
// - vitallens.js: su build de navegador referencia un worker de FFmpeg que no viene en el paquete y rompe
//   el bundler, y carga sus modelos de detección de rostro relativos a su propia URL (dist/models/).
// - Shen.AI: carga su WASM y sus workers relativos a su propia URL (import.meta.url).
import { cpSync, mkdirSync, rmSync } from "node:fs";

const vitallens = "public/vendor/vitallens";
rmSync(vitallens, { recursive: true, force: true });
mkdirSync(vitallens, { recursive: true });
cpSync("node_modules/vitallens/dist/vitallens.browser.js", `${vitallens}/vitallens.browser.js`);
cpSync("node_modules/vitallens/dist/models", `${vitallens}/models`, { recursive: true });
console.log(`vitallens copiado a ${vitallens}`);

const shenai = "public/vendor/shenai";
rmSync(shenai, { recursive: true, force: true });
mkdirSync(shenai, { recursive: true });
for (const f of ["index.mjs", "shenai_sdk.mjs", "shenai_sdk.wasm", "util", "enums"]) {
  cpSync(`node_modules/@shenai/sdk/${f}`, `${shenai}/${f}`, { recursive: true });
}
console.log(`Shen.AI copiado a ${shenai}`);
