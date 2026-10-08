"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { BiometricReading, BiometricValues } from "@/lib/engine/biometrics";
import { cx } from "./ui";

// Panel de mediciones (Shen.AI): pantalla completa con aspecto de monitor clínico. Cinco instrumentos:
// frecuencia cardiaca, variabilidad, respiración, índice de estrés y actividad parasimpática. Solo describe
// valores y su referencia; nunca diagnostica. Los resultados guardados antes de Shen.AI no traen `values`.

const EMPTY: BiometricValues = { heartRateBpm: null, respiratoryRateBpm: null, hrvSdnnMs: null, hrvLnrmssdMs: null, stressIndex: null, parasympatheticActivity: null };

const CYAN = "#5eead4";
const MAGENTA = "#ff6fb0";

function useCountUp(to: number | null, ms = 1500) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to === null) return;
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
  }, [to, ms]);
  return n;
}

function Module({ code, title, delay, children }: { code: string; title: string; delay: number; children: ReactNode }) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="relative h-full overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.035)] p-4 motion-safe:animate-[sheet_600ms_cubic-bezier(0.23,1,0.32,1)_both]"
    >
      <span aria-hidden className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-[#5eead4] to-transparent" />
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] font-medium tracking-[0.12em] text-[#9bb3b0] uppercase">{title}</h2>
        <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9.5px] text-[#6f8582]">{code}</span>
      </header>
      {children}
    </section>
  );
}

function Value({ value, unit, digits = 0, large }: { value: number | null; unit: string; digits?: number; large?: boolean }) {
  const n = useCountUp(value);
  return (
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className={cx("font-mono font-medium text-white tabular-nums", large ? "text-[52px] leading-none" : "text-[40px] leading-none")}>
        {value === null ? "--" : n.toFixed(digits)}
      </span>
      <span className="font-mono text-[12px] text-[#9bb3b0]">{unit}</span>
    </div>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="mt-3 text-[12.5px] leading-[1.55] text-[#b9c9c7]">{children}</p>;
const Unavailable = () => <p className="mt-4 text-[12.5px] leading-[1.55] text-[#8aa09d]">No se pudo leer con suficiente claridad esta vez, así que no la usamos.</p>;

function Chip({ tone, children }: { tone: "ok" | "warn" | "hot" | "neutral"; children: ReactNode }) {
  const c = { ok: "border-[#5eead4]/40 bg-[#5eead4]/10 text-[#5eead4]", warn: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]", hot: "border-[#ff6fb0]/50 bg-[#ff6fb0]/10 text-[#ff9fc9]", neutral: "border-white/15 bg-white/5 text-[#b9c9c7]" }[tone];
  return <span className={cx("inline-block rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em]", c)}>{children}</span>;
}

// Traza tipo ECG a la velocidad real del pulso (visualización ilustrativa, no el registro del latido).
const beat = (o: number) => `L${o + 30} 40L${o + 36} 40L${o + 42} 28L${o + 48} 40L${o + 54} 40L${o + 60} 6L${o + 68} 66L${o + 76} 40L${o + 86} 40L${o + 98} 32L${o + 110} 40L${o + 140} 40`;
const ECG_PATH = `M0 40${beat(0)}${beat(140)}`;
function EcgTrace({ bpm }: { bpm: number }) {
  const secPerBeat = 60 / Math.min(180, Math.max(35, bpm));
  return (
    <div className="relative mt-3 h-[72px] overflow-hidden rounded-xl bg-black/35 ring-1 ring-white/10">
      <div aria-hidden className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "linear-gradient(rgba(94,234,212,0.55) 1px,transparent 1px),linear-gradient(90deg,rgba(94,234,212,0.55) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
      <svg viewBox="0 0 280 72" preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full w-[200%] motion-safe:animate-[pulse-scroll_linear_infinite]" style={{ animationDuration: `${secPerBeat * 2}s` }}>
        <path d={ECG_PATH} fill="none" stroke={CYAN} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${CYAN})` }} />
      </svg>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0b1112] to-transparent" />
    </div>
  );
}

// Onda respiratoria a su ritmo real.
function BreathWave({ rpm }: { rpm: number }) {
  const sec = 60 / Math.min(40, Math.max(4, rpm));
  return (
    <div className="relative mt-3 h-[72px] overflow-hidden rounded-xl bg-black/35 ring-1 ring-white/10">
      <div aria-hidden className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "linear-gradient(rgba(94,234,212,0.55) 1px,transparent 1px),linear-gradient(90deg,rgba(94,234,212,0.55) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
      <svg viewBox="0 0 400 72" preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full w-[200%] motion-safe:animate-[pulse-scroll_linear_infinite]" style={{ animationDuration: `${sec * 2}s` }}>
        <path d="M0 36C25 4 75 4 100 36C125 68 175 68 200 36C225 4 275 4 300 36C325 68 375 68 400 36" fill="none" stroke={MAGENTA} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${MAGENTA})` }} />
      </svg>
    </div>
  );
}

// Referencia con banda y marcador: la banda sombreada es el rango típico; el punto, tu valor.
function RangeBar({ value, min, max, from, to, unit }: { value: number; min: number; max: number; from: number; to: number; unit: string }) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="mt-3" aria-hidden>
      <div className="relative h-2 rounded-full bg-white/10">
        <span className="absolute inset-y-0 rounded-full bg-[#5eead4]/30" style={{ left: pct(from), width: `calc(${pct(to)} - ${pct(from)})` }} />
        <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b1112] bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]" style={{ left: pct(value) }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#6f8582]">
        <span>{min}</span>
        <span>Típico {from}–{to} {unit}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// Medidor semicircular del índice de estrés (0–10): 0–4 referencia, 5–8 elevada, 9–10 muy elevada.
function StressGauge({ value }: { value: number }) {
  const R = 70;
  const arc = (a: number, b: number) => {
    const pt = (t: number) => [100 + R * Math.cos(Math.PI * (1 - t / 10)), 100 - R * Math.sin(Math.PI * (1 - t / 10))];
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const ang = Math.PI * (1 - Math.min(10, Math.max(0, value)) / 10);
  const nx = 100 + (R - 12) * Math.cos(ang);
  const ny = 100 - (R - 12) * Math.sin(ang);
  return (
    <svg viewBox="0 0 200 112" className="mt-2 w-full max-w-[260px]" role="img" aria-label={`Índice de estrés ${value.toFixed(1)} de 10`}>
      <path d={arc(0, 4.95)} stroke="#5eead4" strokeOpacity="0.55" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d={arc(5, 8.95)} stroke="#fbbf24" strokeOpacity="0.6" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d={arc(9, 10)} stroke="#ff6fb0" strokeOpacity="0.75" strokeWidth="9" fill="none" strokeLinecap="round" />
      <line x1="100" y1="100" x2={nx} y2={ny} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: "100px 100px" }} className="motion-safe:animate-[needle_1400ms_cubic-bezier(0.23,1,0.32,1)_both]" />
      <circle cx="100" cy="100" r="5" fill="#fff" />
      <g fontFamily="var(--font-mono)" fontSize="9" fill="#6f8582"><text x="22" y="110">0</text><text x="96" y="22">5</text><text x="172" y="110">10</text></g>
    </svg>
  );
}

// Balance de control del pulso: la parte parasimpática (calma y recuperación) frente al resto.
function BalanceBar({ pct }: { pct: number }) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div className="mt-3" aria-hidden>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        <span className="h-full bg-[#5eead4] shadow-[0_0_12px_rgba(94,234,212,0.6)] transition-[width] duration-1000 ease-out" style={{ width: `${p}%` }} />
        <span className="h-full bg-[#ff6fb0]/60" style={{ width: `${100 - p}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#8aa09d]">
        <span>Calma y recuperación {Math.round(p)}%</span>
        <span>Activación {Math.round(100 - p)}%</span>
      </div>
    </div>
  );
}

const hrTone = (l?: string) => (l === "Dentro de lo típico" ? "ok" : "warn");

export function ClinicalPanel({ bio, completedAt, code, onContinue, footer }: { bio: BiometricReading; completedAt?: string; code?: string; onContinue?: () => void; footer?: ReactNode }) {
  const v = bio.values ?? EMPTY;
  const hr = v.heartRateBpm;
  const rr = v.respiratoryRateBpm;
  const stress = bio.stress ?? null;
  const date = completedAt ? new Date(completedAt) : null;
  const measured = date && !Number.isNaN(date.getTime()) ? date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : null;
  const id = code ? code.replace(/-/g, "").slice(0, 8).toUpperCase() : null;
  const stressTone = stress?.label === "Dentro de la referencia" ? "ok" : stress?.label === "Carga elevada" ? "warn" : "hot";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#0b1112] text-white">
      {/* Papel milimétrico + resplandor */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#5eead4 1px,transparent 1px),linear-gradient(90deg,#5eead4 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(165,25,89,0.28),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#5eead4] to-transparent opacity-60" />

      <div className="relative mx-auto w-full max-w-[1080px] px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.14em] text-[#5eead4] uppercase">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full rounded-full bg-[#5eead4] opacity-70 motion-safe:animate-ping" /><span className="relative inline-flex size-2 rounded-full bg-[#5eead4]" /></span>
              Panel de mediciones · WeNow 360
            </div>
            <h1 className="mt-3 text-[30px] leading-[1.08] font-extrabold tracking-[-0.025em] lg:text-[42px]">Tu lectura biométrica</h1>
            <p className="mt-2 max-w-[560px] text-[14px] leading-[1.6] text-[#b9c9c7]">Cinco mediciones tomadas con la cámara de tu dispositivo en un minuto, sin tocar nada.</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[10.5px] text-[#8aa09d] sm:text-right">
            <div><dt className="uppercase">Medición</dt><dd className="text-[12px] text-white">{id ?? "—"}</dd></div>
            <div><dt className="uppercase">Duración</dt><dd className="text-[12px] text-white">60 s</dd></div>
            <div className="col-span-2"><dt className="uppercase">Fecha</dt><dd className="text-[12px] text-white">{measured ?? "—"}</dd></div>
          </dl>
        </header>

        <div className="mt-7 grid gap-3.5 md:grid-cols-2 lg:grid-cols-6">
          <div className="h-full md:col-span-2 lg:col-span-3">
            <Module code="HR" title="Frecuencia cardiaca" delay={0}>
              {hr === null ? <Unavailable /> : (
                <>
                  <Value value={hr} unit="lpm" large />
                  <EcgTrace bpm={hr} />
                  <RangeBar value={hr} min={40} max={140} from={60} to={100} unit="lpm" />
                  {bio.heartRate && <div className="mt-3"><Chip tone={hrTone(bio.heartRate.label)}>{bio.heartRate.label.toUpperCase()}</Chip></div>}
                  <Note>{bio.heartRate?.context}</Note>
                </>
              )}
            </Module>
          </div>

          <div className="h-full md:col-span-2 lg:col-span-3">
            <Module code="BR" title="Frecuencia respiratoria" delay={120}>
              {rr === null ? <Unavailable /> : (
                <>
                  <Value value={rr} unit="rpm" large />
                  <BreathWave rpm={rr} />
                  <RangeBar value={rr} min={4} max={30} from={12} to={20} unit="rpm" />
                  {bio.respiratoryRate && <div className="mt-3"><Chip tone={hrTone(bio.respiratoryRate.label)}>{bio.respiratoryRate.label.toUpperCase()}</Chip></div>}
                  <Note>{bio.respiratoryRate?.context}</Note>
                </>
              )}
            </Module>
          </div>

          <div className="h-full md:col-span-2 lg:col-span-2">
            <Module code="HRV" title="Variabilidad cardiaca" delay={240}>
              {v.hrvSdnnMs === null && v.hrvLnrmssdMs === null ? <Unavailable /> : (
                <>
                  {v.hrvSdnnMs !== null && <Value value={v.hrvSdnnMs} unit="ms · SDNN" />}
                  {v.hrvLnrmssdMs !== null && (
                    <div className="mt-2 flex items-baseline gap-1.5 font-mono"><span className="text-[18px] text-white tabular-nums">{v.hrvLnrmssdMs.toFixed(1)}</span><span className="text-[11px] text-[#9bb3b0]">ms · lnRMSSD</span></div>
                  )}
                  <div className="mt-3"><Chip tone="neutral">SIN RANGO UNIVERSAL</Chip></div>
                  <Note>Mide cuánto cambia el tiempo entre un latido y otro. Es útil para compararte contigo, a la misma hora y en reposo; una variabilidad mayor suele acompañar un cuerpo que se adapta mejor.</Note>
                </>
              )}
            </Module>
          </div>

          <div className="h-full md:col-span-1 lg:col-span-2">
            <Module code="STR" title="Índice de estrés" delay={360}>
              {v.stressIndex === null ? <Unavailable /> : (
                <>
                  <div className="mt-1 flex justify-center"><StressGauge value={v.stressIndex} /></div>
                  <div className="-mt-1 flex items-baseline justify-center gap-1.5"><span className="font-mono text-[34px] leading-none font-medium tabular-nums">{v.stressIndex.toFixed(1)}</span><span className="font-mono text-[12px] text-[#9bb3b0]">/ 10</span></div>
                  {stress && <div className="mt-3 text-center"><Chip tone={stressTone}>{stress.label.toUpperCase()}</Chip></div>}
                  <Note>{stress?.context} Mide la carga fisiológica de tu cuerpo; no evalúa emociones ni tu estado mental.</Note>
                </>
              )}
            </Module>
          </div>

          <div className="h-full md:col-span-1 lg:col-span-2">
            <Module code="PSY" title="Actividad parasimpática" delay={480}>
              {v.parasympatheticActivity === null ? <Unavailable /> : (
                <>
                  <Value value={v.parasympatheticActivity} unit="%" large />
                  <BalanceBar pct={v.parasympatheticActivity} />
                  <Note>Qué parte del control de tu pulso corresponde a la rama de calma y recuperación de tu sistema nervioso. Más porcentaje indica más influencia de esa rama.</Note>
                </>
              )}
            </Module>
          </div>
        </div>

        <p className="mt-7 max-w-[760px] font-mono text-[10.5px] leading-[1.7] text-[#7d918e]">
          Medición con tecnología Shen.AI. Orientación de bienestar: no es un dispositivo médico ni un diagnóstico, y los trazos son una visualización ilustrativa de tus valores. Si tienes síntomas o dudas sobre tu salud, consulta a un profesional.
        </p>

        {(onContinue || footer) && (
          <div className="sticky bottom-0 -mx-5 mt-6 border-t border-white/10 bg-[#0b1112]/90 px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))] backdrop-blur lg:-mx-8 lg:px-8">
            <div className="mx-auto max-w-[440px]">
              {footer ?? (
                <button type="button" onClick={onContinue} className="press w-full rounded-full bg-[var(--blue)] py-4 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(165,25,89,0.4)]">
                  Continuar con mi resultado
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
