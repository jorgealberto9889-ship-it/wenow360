"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { BiometricReading, BiometricValues } from "@/lib/engine/biometrics";
import { Chevron, Collapse, cx } from "./ui";
import { useInView } from "./trust";

// Panel de mediciones (Shen.AI): pantalla clara y limpia, con la estructura de una app de salud y los colores de
// WeNow (magenta y carbón). Cinco indicadores (pulso, VFC, respiración, estrés y actividad parasimpática) y un
// resumen con el índice WeNow de bienestar. Cada tarjeta se anima cuando entra en pantalla: el corazón late al
// ritmo medido, las barras respiran a su frecuencia, las líneas se dibujan y los medidores se llenan.
// Solo describe valores y su referencia; nunca diagnostica. Los resultados guardados antes de Shen.AI no traen `values`.

const EMPTY: BiometricValues = { heartRateBpm: null, respiratoryRateBpm: null, hrvSdnnMs: null, hrvLnrmssdMs: null, stressIndex: null, parasympatheticActivity: null, hrSeries: null };

const MAGENTA = "#a51959";
const MAGENTA_BRIGHT = "#c71f70";
const OK = { chip: "bg-[#fbeef4] text-[#a51959]", line: MAGENTA_BRIGHT };
const WARN = { chip: "bg-[#fff3d6] text-[#8a5a00]", line: "#e0a100" };
const HOT = { chip: "bg-[#fde8e6] text-[#b42318]", line: "#d93025" };
const NEUTRAL = { chip: "bg-[#f1ecef] text-[#5a5456]", line: "#a3a2a2" };
type Tone = typeof OK;

// Las animaciones de cada tarjeta arrancan cuando ella entra en pantalla.
const Seen = createContext(true);
const useSeen = () => useContext(Seen);

function useCountUp(to: number | null, run: boolean, ms = 1300) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to === null || !run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setN(to));
      return () => cancelAnimationFrame(raf);
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return n;
}

const Icon = ({ children, tint, beatSec }: { children: ReactNode; tint: string; beatSec?: number }) => {
  const seen = useSeen();
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: `${tint}1f`, color: tint }}>
      <svg
        viewBox="0 0 24 24" className={cx("size-[19px]", Boolean(beatSec) && seen && "motion-safe:animate-[heartbeat_var(--beat)_ease-in-out_infinite]")}
        style={beatSec ? ({ "--beat": `${beatSec}s` } as React.CSSProperties) : undefined}
        fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden
      >
        {children}
      </svg>
    </span>
  );
};

function Metric({
  icon, title, tint, tone, status, explain, delay, wide, beatSec, children,
}: { icon: ReactNode; title: string; tint: string; tone: Tone; status: string; explain: string; delay: number; wide?: boolean; beatSec?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Seen.Provider value={seen}>
      <section
        ref={ref}
        style={{ transitionDelay: seen ? `${delay}ms` : "0ms" }}
        className={cx(
          "rounded-[22px] border border-[var(--line)] bg-white p-4 shadow-[0_10px_26px_rgba(56,56,56,0.05)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          seen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          wide && "sm:col-span-2",
        )}
      >
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-left">
          <Icon tint={tint} beatSec={beatSec}>{icon}</Icon>
          <span className="min-w-0 flex-1 text-[14px] leading-tight font-semibold text-[var(--navy)]">{title}</span>
          <span className={cx("rounded-full px-2.5 py-1 text-[11.5px] font-bold", tone.chip)}>{status}</span>
          <span className="text-[#a3a2a2]"><Chevron open={open} /></span>
        </button>
        <div className="mt-3">{children}</div>
        <Collapse open={open}>
          <p className="mt-3 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#4a4547]">{explain}</p>
        </Collapse>
      </section>
    </Seen.Provider>
  );
}

function Big({ value, unit, digits = 0 }: { value: number; unit?: string; digits?: number }) {
  const n = useCountUp(value, useSeen());
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[38px] leading-none font-extrabold tracking-[-0.03em] text-[var(--navy)] tabular-nums">{n.toFixed(digits)}</span>
      {unit && <span className="text-[14px] font-medium text-[var(--muted)]">{unit}</span>}
    </div>
  );
}

const Unavailable = () => <p className="text-[12.5px] leading-[1.55] text-[var(--muted)]">No se pudo leer con suficiente claridad esta vez, así que no la usamos.</p>;

// Línea del pulso medido (serie real) o, si no llegó, una traza suave con el valor medido. Se dibuja de izquierda a
// derecha, el área se funde y un punto vivo late al final.
function Sparkline({ id, series, fallback, color, min, max }: { id: string; series: number[] | null; fallback: number; color: string; min: number; max: number }) {
  const seen = useSeen();
  const real = series && series.length >= 3;
  const pts = real ? series : Array.from({ length: 24 }, (_, i) => fallback + Math.sin(i * 0.9) * 2.2 + Math.cos(i * 0.45) * 1.4);
  const lo = real ? Math.min(...pts) - 4 : Math.min(min, ...pts);
  const hi = real ? Math.max(...pts) + 4 : Math.max(max, ...pts);
  const x = (i: number) => (i / (pts.length - 1)) * 200;
  const y = (v: number) => 46 - ((v - lo) / (hi - lo || 1)) * 40;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const endY = (y(pts[pts.length - 1]) / 52) * 100;
  return (
    <div className="relative">
      <svg viewBox="0 0 200 52" preserveAspectRatio="none" className="h-14 w-full" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
        </defs>
        <path d={`${d}L200 52L0 52Z`} fill={`url(#${id})`} className={cx("transition-opacity duration-1000 delay-700", seen ? "opacity-100" : "opacity-0")} />
        <path
          d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          pathLength={1} strokeDasharray="1" strokeDashoffset={seen ? 0 : 1} className="transition-[stroke-dashoffset] duration-[1600ms] ease-out motion-reduce:transition-none"
        />
      </svg>
      <span aria-hidden className={cx("absolute -right-1 size-2.5 -translate-y-1/2 transition-opacity delay-[1500ms] duration-500", seen ? "opacity-100" : "opacity-0")} style={{ top: `${endY}%` }}>
        <span className="absolute inset-0 rounded-full motion-safe:animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ background: color, opacity: 0.55 }} />
        <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      </span>
    </div>
  );
}

// Barras tipo ecualizador: cada una "respira" al ritmo medido (un ciclo por respiración).
function BreathBars({ rpm, color }: { rpm: number; color: string }) {
  const seen = useSeen();
  const bars = 28;
  const cycle = Math.min(8, Math.max(1.6, 60 / rpm));
  return (
    <div className="flex h-14 items-center justify-between gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const wave = Math.abs(Math.sin((i / bars) * Math.PI * (rpm / 3.2)));
        return (
          <span
            key={i}
            className={cx("h-full w-full origin-center", seen && "motion-safe:animate-[bar-rise_700ms_ease-out_both]")}
            style={{ animationDelay: `${i * 18}ms`, transform: seen ? undefined : "scaleY(0.15)" }}
          >
            <span
              className="block h-full w-full origin-center rounded-full motion-safe:animate-[breathe_var(--cycle)_ease-in-out_infinite]"
              style={{
                "--cycle": `${cycle}s`, animationDelay: `${-(i / bars) * cycle}s`,
                height: `${(18 + wave * 82).toFixed(1)}%`, margin: "auto", background: color, opacity: Number((0.35 + wave * 0.65).toFixed(2)),
              } as React.CSSProperties}
            />
          </span>
        );
      })}
    </div>
  );
}

// Medidor semicircular del índice de estrés (0–10): el arco se llena y una perilla marca el valor.
function StressGauge({ value, color }: { value: number; color: string }) {
  const seen = useSeen();
  const R = 54;
  const pt = (t: number) => [70 + R * Math.cos(Math.PI * (1 - t / 10)), 70 - R * Math.sin(Math.PI * (1 - t / 10))];
  const [sx, sy] = pt(0);
  const [ex, ey] = pt(10);
  const v = Math.min(10, Math.max(0, value));
  const [vx, vy] = pt(v);
  return (
    <svg viewBox="0 0 140 84" className="mx-auto h-[84px] w-[140px]" role="img" aria-label={`Índice de estrés ${value.toFixed(1)} de 10`}>
      <path d={`M${sx} ${sy}A${R} ${R} 0 0 1 ${ex} ${ey}`} stroke="#ece6e9" strokeWidth="11" fill="none" strokeLinecap="round" />
      {v > 0.2 && (
        <path
          d={`M${sx} ${sy}A${R} ${R} 0 0 1 ${vx.toFixed(1)} ${vy.toFixed(1)}`} stroke={color} strokeWidth="11" fill="none" strokeLinecap="round"
          pathLength={1} strokeDasharray="1" strokeDashoffset={seen ? 0 : 1} className="transition-[stroke-dashoffset] duration-[1400ms] ease-out motion-reduce:transition-none"
        />
      )}
      <circle cx={vx.toFixed(1)} cy={vy.toFixed(1)} r="4.5" fill="#fff" stroke={color} strokeWidth="2.5" className={cx("transition-opacity delay-[1300ms] duration-500", seen ? "opacity-100" : "opacity-0")} />
    </svg>
  );
}

// Anillo del índice WeNow de bienestar: se llena, y al terminar late con un halo suave.
function ScoreRing({ score, color }: { score: number; color: string }) {
  const n = useCountUp(score, true, 1600);
  const C = 2 * Math.PI * 46;
  return (
    <div className="relative size-[132px] shrink-0">
      <span aria-hidden className="absolute inset-2 rounded-full motion-safe:animate-[halo-soft_3s_ease-in-out_1.8s_infinite]" style={{ boxShadow: `0 0 28px ${color}55` }} />
      <svg viewBox="0 0 110 110" className="relative size-full -rotate-90" aria-hidden>
        <circle cx="55" cy="55" r="46" stroke="#eee8eb" strokeWidth="10" fill="none" />
        <circle cx="55" cy="55" r="46" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - n / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] leading-none font-extrabold tracking-[-0.03em] text-[var(--navy)] tabular-nums">{Math.round(n)}</span>
        <span className="mt-0.5 text-[12px] font-medium text-[var(--muted)]">/ 100</span>
      </div>
    </div>
  );
}

const rangeTone = (label?: string): Tone => (label === "Dentro de lo típico" ? OK : WARN);
const shortRange = (label?: string) => (label === "Dentro de lo típico" ? "Normal" : label === "Ligeramente acelerada" ? "Elevada" : "Baja");

export function ClinicalPanel({ bio, completedAt, footer }: { bio: BiometricReading; completedAt?: string; footer?: ReactNode }) {
  const v = bio.values ?? EMPTY;
  const hr = v.heartRateBpm;
  const rr = v.respiratoryRateBpm;
  const stress = bio.stress ?? null;
  const wellness = bio.wellness ?? null;
  const [info, setInfo] = useState(false);
  const date = completedAt ? new Date(completedAt) : null;
  const measured = date && !Number.isNaN(date.getTime()) ? date.toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
  const stressTone = stress?.label === "Dentro de la referencia" ? OK : stress?.label === "Carga elevada" ? WARN : HOT;
  const wellTone = wellness?.label === "Óptimo" || wellness?.label === "Bueno" ? OK : WARN;
  const stressShort = stress?.label === "Dentro de la referencia" ? "En referencia" : stress?.label === "Carga elevada" ? "Elevado" : "Muy elevado";
  const beatSec = hr ? Math.min(1.8, Math.max(0.4, 60 / hr)) : undefined;

  return (
    <div className="min-h-dvh w-full bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-[760px] px-5 pt-5 pb-6">
        <header className="flex items-center justify-between">
          <Image src="/assets/wenow-360-logo.png" alt="WeNow 360" width={1259} height={1132} sizes="64px" priority className="h-11 w-auto" />
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[var(--muted)] uppercase ring-1 ring-[var(--line)]">Panel de mediciones</span>
        </header>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="min-w-0 motion-safe:animate-[sheet_600ms_cubic-bezier(0.23,1,0.32,1)_both]">
            <h1 className="text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-[var(--navy)] sm:text-[40px]">Resultados</h1>
            <p className="mt-1 text-[16px] text-[var(--muted)]">Escaneo de bienestar</p>
            <ul className="mt-4 flex flex-col gap-2 text-[13px] text-[#4a4547]">
              {measured && (
                <li className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" className="size-[18px] text-[#a3a2a2]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                  {measured}
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="size-[18px] text-[var(--blue)]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" pathLength={1} strokeDasharray="1" className="motion-safe:animate-[draw_900ms_ease-out_both]" />
                  <path d="M8 12.5l2.7 2.7L16 9.5" pathLength={1} strokeDasharray="1" className="motion-safe:animate-[draw_600ms_ease-out_700ms_both]" />
                </svg>
                Análisis completado · 60 s
              </li>
            </ul>
          </div>
          <div className="relative h-[168px] w-[132px] shrink-0 overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#f6e9f0,#e4d7ee)] shadow-[0_14px_30px_rgba(56,56,56,0.18)] ring-1 ring-white motion-safe:animate-[pop_600ms_cubic-bezier(0.23,1,0.32,1)_both] sm:h-[210px] sm:w-[164px]" aria-hidden>
            <Image src="/assets/modelo-malla.webp" alt="" width={640} height={800} sizes="300px" className="absolute top-0 left-1/2 h-auto w-[150%] max-w-none -translate-x-1/2 -translate-y-[6%]" priority />
            {/* Barrido de lectura sobre el rostro */}
            <span className="pointer-events-none absolute inset-x-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(199,31,112,0.28))] motion-safe:animate-[tile-scan_3.4s_ease-in-out_infinite] motion-reduce:hidden" />
            {["left-2.5 top-2.5 border-l-2 border-t-2 rounded-tl-lg", "right-2.5 top-2.5 border-r-2 border-t-2 rounded-tr-lg", "left-2.5 bottom-2.5 border-l-2 border-b-2 rounded-bl-lg", "right-2.5 bottom-2.5 border-r-2 border-b-2 rounded-br-lg"].map((c) => (
              <span key={c} className={cx("absolute size-5 border-[var(--blue-bright)] motion-safe:animate-[halo-soft_2.4s_ease-in-out_infinite]", c)} />
            ))}
          </div>
        </div>

        {wellness && (
          <section className="mt-5 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[0_12px_30px_rgba(56,56,56,0.06)] motion-safe:animate-[sheet_600ms_cubic-bezier(0.23,1,0.32,1)_120ms_both]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--navy)]">
                  Índice WeNow de bienestar
                  <button type="button" aria-expanded={info} aria-label="Cómo se calcula" onClick={() => setInfo(!info)} className="press text-[#a3a2a2]">
                    <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.2" /></svg>
                  </button>
                </div>
                <div className="mt-1 text-[32px] leading-[1.1] font-extrabold tracking-[-0.025em]" style={{ color: wellTone === WARN ? "#8a5a00" : MAGENTA }}>{wellness.label}</div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--muted)]">{wellness.message}</p>
                <p className="mt-2 text-[12px] font-semibold text-[#4a4547]">{wellness.inRange} de {wellness.total} indicadores en referencia</p>
              </div>
              <ScoreRing score={wellness.score} color={wellTone.line} />
            </div>
            <Collapse open={info}>
              <p className="mt-3 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#4a4547]">
                Es una síntesis orientativa de WeNow: combina tu frecuencia cardiaca, tu frecuencia respiratoria y tu índice de estrés frente a sus rangos de referencia. La variabilidad y la actividad parasimpática no puntúan porque no tienen un rango universal. No es una medida clínica.
              </p>
            </Collapse>
          </section>
        )}

        <h2 className="mt-7 mb-3 text-[19px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">Indicadores principales</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Metric
            title="Frecuencia cardiaca" tint={MAGENTA_BRIGHT} tone={rangeTone(bio.heartRate?.label)} status={hr === null ? "Sin lectura" : shortRange(bio.heartRate?.label)} delay={0} beatSec={beatSec}
            icon={<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />}
            explain={`Cuántas veces late tu corazón por minuto en reposo. Lo típico es de 60 a 100. ${bio.heartRate?.context ?? ""}`}
          >
            {hr === null ? <Unavailable /> : (
              <>
                <Big value={hr} unit="lpm" />
                <div className="mt-2"><Sparkline id="sp-hr" series={v.hrSeries} fallback={hr} color={rangeTone(bio.heartRate?.label).line} min={50} max={90} /></div>
                <p className="mt-1 text-[10.5px] text-[#a3a2a2]">{v.hrSeries && v.hrSeries.length >= 3 ? "Tu pulso durante la medición" : "Trazo ilustrativo de tu valor"}</p>
              </>
            )}
          </Metric>

          <Metric
            title="Variabilidad cardiaca (VFC)" tint="#6f6a6c" tone={NEUTRAL} status={v.hrvSdnnMs === null && v.hrvLnrmssdMs === null ? "Sin lectura" : "Tu referencia"} delay={120}
            icon={<path d="M3 12h4l2-5 4 10 2-5h6" />}
            explain="Cuánto cambia el tiempo entre un latido y otro. No hay un valor ideal universal: sirve para compararte contigo, a la misma hora y en reposo. Una variabilidad mayor suele acompañar un cuerpo que se adapta mejor al día a día."
          >
            {v.hrvSdnnMs === null && v.hrvLnrmssdMs === null ? <Unavailable /> : (
              <>
                {v.hrvSdnnMs !== null ? <Big value={v.hrvSdnnMs} unit="ms" /> : <Big value={v.hrvLnrmssdMs!} unit="ms" digits={1} />}
                {v.hrvSdnnMs !== null && v.hrvLnrmssdMs !== null && <p className="mt-1 text-[12px] text-[var(--muted)]">SDNN · lnRMSSD {v.hrvLnrmssdMs.toFixed(1)} ms</p>}
                <div className="mt-2"><Sparkline id="sp-hrv" series={null} fallback={v.hrvSdnnMs ?? 40} color="#383838" min={0} max={100} /></div>
                <p className="mt-1 text-[10.5px] text-[#a3a2a2]">Trazo ilustrativo de tu valor</p>
              </>
            )}
          </Metric>

          <Metric
            title="Frecuencia respiratoria" tint="#383838" tone={rangeTone(bio.respiratoryRate?.label)} status={rr === null ? "Sin lectura" : shortRange(bio.respiratoryRate?.label)} delay={240}
            icon={<><path d="M9 4v8c0 3-2 5-5 5V9c0-2 2-5 5-5Z" /><path d="M15 4v8c0 3 2 5 5 5V9c0-2-2-5-5-5Z" /></>}
            explain={`Cuántas veces respiras por minuto en reposo. Lo típico es de 12 a 20. ${bio.respiratoryRate?.context ?? ""}`}
          >
            {rr === null ? <Unavailable /> : (
              <>
                <Big value={rr} unit="rpm" />
                <div className="mt-2"><BreathBars rpm={rr} color={rangeTone(bio.respiratoryRate?.label).line} /></div>
              </>
            )}
          </Metric>

          <Metric
            title="Índice de estrés" tint="#e0a100" tone={stressTone} status={v.stressIndex === null ? "Sin lectura" : stressShort} delay={360}
            icon={<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8Z" />}
            explain={`Una escala de 0 a 10 de la carga fisiológica de tu cuerpo durante la medición: de 0 a 4 está en referencia, de 5 a 8 es elevada y de 9 a 10 muy elevada. No mide emociones ni tu estado mental. ${stress?.context ?? ""}`}
          >
            {v.stressIndex === null ? <Unavailable /> : (
              <div className="text-center">
                <StressGauge value={v.stressIndex} color={stressTone.line} />
                <div className="-mt-9 flex items-baseline justify-center gap-1"><StressNumber value={v.stressIndex} /><span className="text-[13px] text-[#a3a2a2]">/ 10</span></div>
                <p className="mt-2 text-[12px] leading-snug text-[var(--muted)]">{stress?.context}</p>
              </div>
            )}
          </Metric>

          <Metric
            wide title="Actividad parasimpática" tint={MAGENTA} tone={NEUTRAL} status={v.parasympatheticActivity === null ? "Sin lectura" : "Calma y recuperación"} delay={480}
            icon={<><path d="M12 21c-4-3-7-6-7-10 3 0 5 1 7 3 2-2 4-3 7-3 0 4-3 7-7 10Z" /><path d="M12 14V8" /></>}
            explain="Qué parte del control de tu pulso corresponde a la rama de calma y recuperación de tu sistema nervioso (se calcula con las frecuencias bajas y altas de tu variabilidad). Más porcentaje indica más influencia de esa rama."
          >
            {v.parasympatheticActivity === null ? <Unavailable /> : <ParasympatheticBar value={v.parasympatheticActivity} />}
          </Metric>
        </div>

        <p className="mt-6 text-[11.5px] leading-[1.65] text-[var(--muted)]">
          Medición con tecnología Shen.AI. Orientación de bienestar: no es un dispositivo médico ni un diagnóstico. Si tienes síntomas o dudas sobre tu salud, consulta a un profesional.
        </p>
      </div>

      {footer && (
        <>
          <div aria-hidden className="h-[104px]" />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)]">
            <div className="mx-auto max-w-[440px] px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))]">{footer}</div>
          </div>
        </>
      )}
    </div>
  );
}

function StressNumber({ value }: { value: number }) {
  const n = useCountUp(value, useSeen(), 1400);
  return <span className="text-[28px] leading-none font-extrabold text-[var(--navy)] tabular-nums">{n.toFixed(1)}</span>;
}

// Barra de calma y recuperación: se llena y un brillo la recorre.
function ParasympatheticBar({ value }: { value: number }) {
  const seen = useSeen();
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <Big value={value} unit="%" />
      <div className="flex-1">
        <div className="relative h-3 overflow-hidden rounded-full bg-[#ece6e9]" aria-hidden>
          <span className="relative block h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#a51959,#e284ab)] transition-[width] duration-[1600ms] ease-out motion-reduce:transition-none" style={{ width: seen ? `${pct}%` : "0%" }}>
            <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] motion-safe:animate-[cta-shine_2.6s_ease-in-out_1.8s_infinite] motion-reduce:hidden" />
          </span>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-[#a3a2a2]"><span>Más activación</span><span>Más calma y recuperación</span></div>
      </div>
    </div>
  );
}
