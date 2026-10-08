"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useInView } from "./trust";
import { cx } from "./ui";

// ── Malla del rostro ────────────────────────────────────────────────────────────────────────────
// Se genera en código (determinista, igual en servidor y cliente): una retícula triangulada recortada con
// la forma de un rostro. Cada punto es un nodo; cada arista, una línea fina de la malla.
const FACE = { cx: 160, top: 46, bottom: 356, half: 104 };
const ROW = 20;
const COL = 22;

function halfWidth(y: number) {
  const mid = (FACE.top + FACE.bottom) / 2 - 16;
  const t = (y - mid) / ((FACE.bottom - FACE.top) / 2);
  if (Math.abs(t) >= 1) return 0;
  const taper = y > mid ? 1 - 0.2 * Math.pow(t, 1.6) : 1;
  return FACE.half * Math.sqrt(1 - t * t) * taper;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function buildMesh() {
  const rows: { x: number; y: number }[][] = [];
  for (let y = FACE.top + 6, i = 0; y < FACE.bottom - 4; y += ROW, i++) {
    const hw = halfWidth(y) - 4;
    const row: { x: number; y: number }[] = [];
    if (hw > 8) {
      const off = i % 2 ? COL / 2 : 0;
      for (let x = FACE.cx - hw + off + 2; x <= FACE.cx + hw; x += COL) {
        // Pequeña irregularidad determinista para que se sienta orgánica, no una cuadrícula.
        row.push({ x: r1(x + Math.sin(i * 7.3 + x * 0.21) * 2.2), y: r1(y + Math.cos(x * 0.17 + i * 3.1) * 2.2) });
      }
    }
    rows.push(row);
  }
  const edges: string[] = [];
  const nodes: { x: number; y: number }[] = [];
  rows.forEach((row, i) => {
    row.forEach((p, j) => {
      nodes.push(p);
      if (row[j + 1]) edges.push(`M${p.x} ${p.y}L${row[j + 1].x} ${row[j + 1].y}`);
      const below = rows[i + 1] ?? [];
      // Las dos aristas diagonales hacia los vecinos más cercanos de la fila de abajo.
      below
        .map((q) => ({ q, d: Math.abs(q.x - p.x) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
        .forEach(({ q, d }) => { if (d < COL) edges.push(`M${p.x} ${p.y}L${q.x} ${q.y}`); });
    });
  });
  return { d: edges.join(""), nodes };
}

const MESH = buildMesh();

// Contorno suave del rostro (óvalo con mentón más estrecho), dibujado a mano sobre la misma forma.
const OUTLINE =
  "M160 40C108 40 62 80 58 150C56 210 70 262 96 304C118 338 138 356 160 356C182 356 202 338 224 304C250 262 264 210 262 150C258 80 212 40 160 40Z";

// Zonas de lectura (ROI): donde la cámara busca la variación de color de la piel.
const ROIS = [
  { id: "frente", cx: 160, cy: 98, rx: 46, ry: 17, delay: 0 },
  { id: "mejilla-izq", cx: 112, cy: 222, rx: 28, ry: 24, delay: 500 },
  { id: "mejilla-der", cx: 208, cy: 222, rx: 28, ry: 24, delay: 1000 },
];

export function FaceMesh({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 320 400" role="img" aria-label="Malla digital sobre un rostro: la cámara lee tres zonas de la piel" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="rppg-scan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff6fb0" stopOpacity="0" />
          <stop offset="0.85" stopColor="#ff6fb0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd3e8" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id="rppg-face"><path d={OUTLINE} /></clipPath>
      </defs>

      {/* La malla se revela de arriba hacia abajo la primera vez que entra en pantalla. */}
      <g
        style={{ clipPath: live ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
        className="transition-[clip-path] duration-[2200ms] ease-out motion-reduce:transition-none"
      >
        <path d={MESH.d} fill="none" stroke="#e48bb6" strokeOpacity="0.42" strokeWidth="0.8" />
        <g fill="#ffd3e8">
          {MESH.nodes.map((n, i) => (
            <circle
              key={i} cx={n.x} cy={n.y} r={i % 5 === 0 ? 1.9 : 1.2}
              style={{ animationDelay: `${(i * 137) % 2600}ms` }}
              className={cx(i % 3 === 0 && "motion-safe:animate-[node-blink_2.6s_ease-in-out_infinite]")}
              opacity={i % 3 === 0 ? undefined : 0.75}
            />
          ))}
        </g>

        {/* Rasgos mínimos para que se lea como rostro. */}
        <g fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round">
          <path d="M112 160C122 153 136 153 146 160C136 166 122 166 112 160Z" />
          <path d="M174 160C184 153 198 153 208 160C198 166 184 166 174 160Z" />
          <path d="M160 168C158 190 154 206 148 218C152 224 168 224 172 218" />
          <path d="M134 270C148 280 172 280 186 270" />
        </g>

        <path d={OUTLINE} fill="none" stroke="#ff8cc2" strokeWidth="1.8" style={{ filter: "drop-shadow(0 0 5px rgba(255,111,176,0.8))" }} />
      </g>

      {/* Línea de escaneo, recortada al rostro. */}
      <g clipPath="url(#rppg-face)">
        <g className={cx("motion-reduce:hidden", live ? "animate-[scan-sweep_3.8s_ease-in-out_2.2s_infinite]" : "opacity-0")}>
          <rect x="40" y="-60" width="240" height="60" fill="url(#rppg-scan)" />
          <rect x="40" y="-1" width="240" height="1.6" fill="#fff" opacity="0.9" />
        </g>
      </g>

      {/* Zonas de lectura con ondas que laten. */}
      {live && ROIS.map((r) => (
        <g key={r.id} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill="rgba(255,111,176,0.10)" stroke="#ffd3e8" strokeWidth="1.2" strokeDasharray="3 3" />
          <ellipse
            cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill="none" stroke="#ff6fb0" strokeWidth="1.4"
            style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${2200 + r.delay}ms` }}
            className="motion-safe:animate-[roi-pulse_2s_ease-out_infinite]"
          />
        </g>
      ))}
    </svg>
  );
}

// ── Señal de pulso ────────────────────────────────────────────────────────────────────────────
// Un latido (forma típica de una onda de pulso: subida rápida, pico y muesca) repetido 6 veces. La
// animación desplaza la mitad del ancho, así el lazo no se nota.
const BEAT = (o: number) =>
  `${o} 48C${o + 6} 48 ${o + 9} 10 ${o + 16} 8C${o + 24} 6 ${o + 28} 34 ${o + 36} 36C${o + 40} 37 ${o + 41} 30 ${o + 46} 30C${o + 56} 30 ${o + 64} 46 ${o + 78} 48L${o + 100} 48`;
const WAVE = `M${[0, 100, 200, 300, 400, 500].map(BEAT).join("L")}`;

function Segments({ value, total = 12, live, delay = 0 }: { value: number; total?: number; live: boolean; delay?: number }) {
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{ transitionDelay: live ? `${delay + i * 70}ms` : "0ms" }}
          className={cx(
            "h-2 flex-1 rounded-[2px] transition-[background-color,opacity] duration-500 motion-reduce:transition-none",
            live && i < value ? "bg-[#ff6fb0] shadow-[0_0_8px_rgba(255,111,176,0.7)]" : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

// Cuenta de 0 a `to` cuando la sección entra a pantalla (con reduced-motion, directo al valor).
function useCountUp(to: number, run: boolean, ms = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setN(to));
      return () => cancelAnimationFrame(raf);
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return n;
}

function SignalCard({ live }: { live: boolean }) {
  const bpm = useCountUp(72, live);
  const rpm = useCountUp(16, live, 2200);
  return (
    <div className="rounded-[22px] border border-white/15 bg-[rgba(30,30,30,0.78)] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#ffd3e8] uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-[#ff6fb0] opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-[#ff6fb0]" />
          </span>
          Señal rPPG
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.06em] text-[#cfc8cb] uppercase">Ejemplo ilustrativo</span>
      </div>

      <div className="relative mt-3 h-[64px] overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <svg viewBox="0 0 600 56" preserveAspectRatio="none" className={cx("absolute inset-y-0 left-0 h-full w-[200%] motion-safe:animate-[pulse-scroll_3.6s_linear_infinite]", !live && "opacity-0")}>
          <path d={WAVE} fill="none" stroke="#ff6fb0" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px rgba(255,111,176,0.9))" }} />
        </svg>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(30,30,30,0.95),transparent)]" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#b1abae] uppercase">Frecuencia cardiaca</dt>
          <dd className="mt-0.5 font-mono text-[26px] leading-none font-medium text-white tabular-nums">{bpm}<span className="ml-1 text-[11px] text-[#b1abae]">lpm</span></dd>
          <div className="mt-2"><Segments value={7} live={live} /></div>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#b1abae] uppercase">Frecuencia respiratoria</dt>
          <dd className="mt-0.5 font-mono text-[26px] leading-none font-medium text-white tabular-nums">{rpm}<span className="ml-1 text-[11px] text-[#b1abae]">rpm</span></dd>
          <div className="mt-2"><Segments value={5} live={live} delay={300} /></div>
        </div>
      </dl>
    </div>
  );
}

// ── Sección ──────────────────────────────────────────────────────────────────────────────────
const STEPS = [
  ["01", "Enciende tu cámara", "Con buena luz y de frente, desde tu celular o computadora."],
  ["02", "Mírala unos segundos", "Sin tocar nada: la cámara observa tu rostro, menos de un minuto."],
  ["03", "Recibe tu lectura", "Cinco mediciones en un panel clínico propio, que además enriquecen tu evaluación."],
];

export function RppgSection({ children }: { children?: ReactNode }) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <section ref={ref} id="tecnologia" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
      <div className="relative overflow-hidden rounded-[32px] bg-[#1d1d1d] px-6 py-12 text-white shadow-[0_28px_60px_rgba(56,56,56,0.35)] lg:px-12 lg:py-16">
        {/* Retícula técnica y resplandor magenta */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(70% 70% at 70% 45%,#000,transparent)" }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/4 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(199,31,112,0.45),transparent_65%)]" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-[#ffd3e8] uppercase">
              <span className="size-1.5 rounded-full bg-[#ff6fb0]" /> Tecnología rPPG
            </span>
            <h2 className="mt-4 text-[32px] leading-[1.06] font-extrabold tracking-[-0.03em] lg:text-[46px]">
              Tu pulso, leído <span className="text-[#ff6fb0]">con la cámara</span>
            </h2>
            <p className="mt-4 max-w-[520px] text-[15px] leading-[1.65] text-[#d9d2d5]">
              La <strong className="font-bold text-white">fotopletismografía remota (rPPG)</strong> detecta los cambios casi invisibles de color que el flujo de sangre provoca en tu piel con cada latido. Con eso, una cámara común estima tu frecuencia cardiaca y respiratoria, tu variabilidad cardiaca, un índice de estrés y tu actividad parasimpática: sin sensores, sin pulseras y sin tocar nada.
            </p>

            <ol className="mt-7 flex flex-col gap-4">
              {STEPS.map(([n, t, d], i) => (
                <li
                  key={n}
                  style={{ transitionDelay: seen ? `${300 + i * 140}ms` : "0ms" }}
                  className={cx(
                    "flex items-start gap-4 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                    seen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0 motion-reduce:translate-x-0 motion-reduce:opacity-100",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#ff6fb0]/40 bg-[#ff6fb0]/10 font-mono text-[13px] font-medium text-[#ffd3e8]">{n}</span>
                  <span className="pt-0.5 text-[14px] leading-[1.5] text-[#d9d2d5]"><strong className="block text-[15px] font-bold text-white">{t}</strong>{d}</span>
                </li>
              ))}
            </ol>

            <p className="mt-6 max-w-[500px] text-[12px] leading-[1.6] text-[#a9a3a6]">
              Es opcional y complementa tu evaluación. El video se procesa en el momento y no se guarda; solo se conservan los valores. Es una orientación de bienestar: no es un dispositivo médico ni diagnostica.
            </p>
            {children && <div className="mt-7">{children}</div>}
          </div>

          {/* Visual: malla del rostro + tarjeta de señal */}
          <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none lg:pb-[130px]">
            <div className="relative mx-auto h-[360px] w-[288px] sm:h-[420px] sm:w-[336px] lg:mx-auto lg:h-[460px] lg:w-[368px]">
              <div aria-hidden className="absolute inset-[-8%] rounded-[40%] bg-[radial-gradient(closest-side,rgba(165,25,89,0.35),transparent)] motion-safe:animate-[halo-soft_4s_ease-in-out_infinite]" />
              <FaceMesh live={seen} />
            </div>
            <div className="relative -mt-10 ml-auto w-[min(100%,330px)] sm:-mt-24 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0">
              <SignalCard live={seen} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
