"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { useInView } from "./trust";
import { cx } from "./ui";

// Sección «Tecnología rPPG» de la portada. Explica el proceso en cuatro etapas: cada una se ilustra con una de las
// fotos de referencia (modelo 3D, puntos de referencia, micromovimientos y flujo de sangre). La foto central cambia
// sola cada pocos segundos y la tarjeta de la etapa activa se ilumina; también se puede tocar una tarjeta para verla.

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
  const hrv = useCountUp(48, live, 2000);
  const stress = useCountUp(32, live, 2400);
  const para = useCountUp(58, live, 2600);
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

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        {[
          ["Frecuencia cardiaca", bpm, "lpm", 7, 0],
          ["Frecuencia respiratoria", rpm, "rpm", 5, 150],
          ["Variabilidad cardiaca", hrv, "ms", 6, 300],
          ["Índice de estrés", (stress / 10).toFixed(1), "/ 10", 3, 450],
          ["Actividad parasimpática", para, "%", 7, 600],
        ].map(([label, value, unit, segs, delay], i) => (
          <div key={label as string} className={i === 4 ? "col-span-2" : undefined}>
            <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#b1abae] uppercase">{label}</dt>
            <dd className="mt-0.5 font-mono text-[24px] leading-none font-medium text-white tabular-nums">{value}<span className="ml-1 text-[11px] text-[#b1abae]">{unit}</span></dd>
            <div className="mt-2"><Segments value={segs as number} live={live} delay={delay as number} /></div>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Sección ──────────────────────────────────────────────────────────────────────────────────
const STAGES = [
  {
    title: "Modelo 3D de tu rostro", text: "Crea un modelo único de tu rostro para saber exactamente dónde leer cada medición.",
    image: "/assets/rppg/malla-3d.webp", caption: "Malla 3D de tu rostro",
    icon: <><path d="M12 3c-4.5 0-7 3.2-7 7.5 0 5 3 9.5 7 10.5 4-1 7-5.5 7-10.5C19 6.2 16.5 3 12 3Z" /><path d="M12 3v18M5.2 9.5h13.6M6 15h12" /></>,
  },
  {
    title: "Datos faciales detallados", text: "Identifica los puntos de referencia de tu rostro para que la lectura sea más estable y detallada.",
    image: "/assets/rppg/puntos.webp", caption: "Puntos de referencia faciales",
    icon: <><path d="M12 5v14M5 12h14" /><circle cx="12" cy="12" r="8.5" /></>,
  },
  {
    title: "Detección de micromovimientos", text: "Detecta pequeños movimientos faciales que pasan desapercibidos para el ojo humano.",
    image: "/assets/rppg/micromovimientos.webp", caption: "Micromovimientos de la piel",
    icon: <><path d="M4 8h16M4 8l3-3M4 8l3 3M20 16H4M20 16l-3-3M20 16l-3 3" /></>,
  },
  {
    title: "Seguimiento del pulso", text: "Registra el flujo y las pulsaciones de la sangre debajo de la piel.",
    image: "/assets/rppg/mapa-calor.webp", caption: "Flujo de sangre bajo la piel",
    icon: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
  },
];

const STEPS = [
  ["01", "Enciende tu cámara", "Con buena luz y de frente, desde tu celular o computadora."],
  ["02", "Mírala unos segundos", "Sin tocar nada: la cámara observa tu rostro, menos de un minuto."],
  ["03", "Recibe tu lectura", "Cinco mediciones en un panel clínico propio, que además enriquecen tu evaluación."],
];

const STAGE_MS = 4200;

function StageCard({ i, active, onSelect, seen }: { i: number; active: boolean; onSelect: () => void; seen: boolean }) {
  const st = STAGES[i];
  return (
    <button
      type="button" aria-pressed={active} onClick={onSelect}
      style={{ transitionDelay: seen ? `${200 + i * 120}ms` : "0ms" }}
      className={cx(
        "group relative flex w-full items-start gap-4 overflow-hidden rounded-[22px] border p-4 text-left transition-[opacity,transform,border-color,background-color] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:p-5",
        seen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        active ? "border-[#ff6fb0]/60 bg-[#ff6fb0]/[0.09] shadow-[0_0_34px_rgba(255,111,176,0.16)]" : "border-white/10 bg-white/[0.03] hover:border-white/25",
      )}
    >
      <span className={cx("flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-500", active ? "border-[#ff6fb0]/60 bg-[#ff6fb0]/15 text-[#ffd3e8]" : "border-white/15 text-[#cfc8cb]")}>
        <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{st.icon}</svg>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.14em] text-[#ff9fc9] uppercase">Etapa {i + 1}</span>
        <span className="mt-0.5 block text-[15.5px] leading-snug font-bold text-white">{st.title}</span>
        <span className="mt-1 block text-[13px] leading-[1.55] text-[#c9c2c5]">{st.text}</span>
      </span>
      {/* Avance de la etapa activa */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
        {active && <span key={`bar-${i}`} className="block h-full origin-left bg-[linear-gradient(90deg,#ff6fb0,#ffd3e8)] motion-safe:animate-[stage-progress_4200ms_linear_both]" />}
      </span>
    </button>
  );
}

export function RppgSection({ children }: { children?: ReactNode }) {
  const [ref, seen] = useInView<HTMLElement>();
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);

  // Avanza sola cada pocos segundos mientras la sección es visible (no con movimiento reducido).
  useEffect(() => {
    if (!seen || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), STAGE_MS);
    return () => clearTimeout(t);
  }, [seen, paused, stage]);

  return (
    <section ref={ref} id="tecnologia" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
      <div className="relative overflow-hidden rounded-[32px] bg-[#101319] px-6 py-12 text-white shadow-[0_28px_60px_rgba(56,56,56,0.35)] lg:px-12 lg:py-16">
        {/* Retícula técnica y resplandor magenta */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(70% 70% at 50% 40%,#000,transparent)" }}
        />
        <div aria-hidden className="pointer-events-none absolute top-[18%] left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,31,112,0.38),transparent_65%)]" />

        <div className="relative mx-auto max-w-[720px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-[#ffd3e8] uppercase">
            <span className="size-1.5 rounded-full bg-[#ff6fb0]" /> Tecnología rPPG
          </span>
          <h2 className="mt-4 text-[32px] leading-[1.06] font-extrabold tracking-[-0.03em] lg:text-[46px]">
            Tu pulso, leído <span className="text-[#ff6fb0]">con la cámara</span>
          </h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-[#d9d2d5]">
            La <strong className="font-bold text-white">fotopletismografía remota (rPPG)</strong> detecta los cambios casi invisibles de color que el flujo de sangre provoca en tu piel con cada latido. Con eso, una cámara común estima tu frecuencia cardiaca y respiratoria, tu variabilidad cardiaca, un índice de estrés y tu actividad parasimpática: sin sensores, sin pulseras y sin tocar nada.
          </p>
        </div>

        {/* Proceso en cuatro etapas: tarjetas alrededor de la foto */}
        <div
          className="relative mt-10 grid items-center gap-4 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:gap-6"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        >
          <div className="order-2 flex flex-col gap-4 lg:order-1 lg:gap-10">
            <StageCard i={0} active={stage === 0} onSelect={() => setStage(0)} seen={seen} />
            <StageCard i={1} active={stage === 1} onSelect={() => setStage(1)} seen={seen} />
          </div>

          <div className="relative order-1 mx-auto w-full max-w-[340px] lg:order-2 lg:max-w-none">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(120%_90%_at_50%_30%,#2a2230,#12151b_70%)] shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
              {STAGES.map((st, i) => (
                <Image
                  key={st.image} src={st.image} alt={`Modelo con ${st.caption.toLowerCase()}`} width={720} height={900} sizes="(min-width:1024px) 380px, 340px"
                  priority={i === 0}
                  className={cx(
                    "absolute inset-0 size-full object-cover object-top transition-[opacity,transform] duration-[900ms] ease-out motion-reduce:transition-none",
                    stage === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
                  )}
                />
              ))}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#101319] to-transparent" />
              {/* Barrido de lectura */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 h-14 bg-[linear-gradient(180deg,transparent,rgba(255,111,176,0.30))] motion-safe:animate-[tile-scan_3.6s_ease-in-out_infinite] motion-reduce:hidden" />
              {["left-3 top-3 border-l-2 border-t-2 rounded-tl-xl", "right-3 top-3 border-r-2 border-t-2 rounded-tr-xl", "left-3 bottom-3 border-l-2 border-b-2 rounded-bl-xl", "right-3 bottom-3 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
                <span key={c} aria-hidden className={cx("absolute size-6 border-[#ff6fb0] motion-safe:animate-[halo-soft_2.4s_ease-in-out_infinite]", c)} />
              ))}
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[10.5px] font-medium tracking-[0.1em] text-[#ffd3e8] uppercase backdrop-blur" aria-live="polite">
                  {stage + 1}/{STAGES.length} · {STAGES[stage].caption}
                </span>
              </div>
            </div>
          </div>

          <div className="order-3 flex flex-col gap-4 lg:gap-10">
            <StageCard i={2} active={stage === 2} onSelect={() => setStage(2)} seen={seen} />
            <StageCard i={3} active={stage === 3} onSelect={() => setStage(3)} seen={seen} />
          </div>
        </div>

        {/* Pasos para el usuario + señal de ejemplo */}
        <div className="relative mt-12 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <ol className="flex flex-col gap-4">
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
          <div className="mx-auto w-full max-w-[420px] lg:max-w-none"><SignalCard live={seen} /></div>
        </div>
      </div>
    </section>
  );
}
