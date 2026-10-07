"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SubmitResult } from "@/lib/assessments";
import type { GoalId, MetricId } from "@/lib/engine/answers";
import {
  ACTIVITY, ALCOHOL, askedMetrics, COMMITMENT, CONDITIONS, DIETARY, EMPTY_DRAFT, FREQUENCY_WORDS, IMPORTANCE_WORDS, MEDICATIONS,
  METRIC_COPY, PREGNANCY, PRIMARY_GOALS, PRODUCE, SECONDARY_GOALS, SEX, SLEEP_HOURS, toAnswers, TOBACCO, WATER,
  YES_NO_UNSURE, type Distributor, type Draft,
} from "./questions";
import { Landing } from "./landing";
import { Result } from "./result";
import { ScanStep, type ScanProvider } from "./scan";
import {
  ArrowRight, CheckIcon, CheckRow, Chip, cx, noAutofill, OptionCard, PrimaryButton, QuestionHeader, Screen, Segmented,
  SubQuestion, Toggle, TopBar,
} from "./ui";

type Phase = "landing" | "consent" | "quiz" | "scan" | "contact" | "analyzing" | "result";

const STEPS = [
  "about", "body", "primary", "secondary", "metrics", "commitment",
  "habits", "lifestyle", "safety", "dietary", "medications", "conditions",
] as const;
type Step = (typeof STEPS)[number];
const TOTAL = STEPS.length + 1;

export function WeNowFlow({
  distributor, scanProvider, ttsEnabled, assistantEnabled,
}: { distributor: Distributor; scanProvider: ScanProvider | null; ttsEnabled: boolean; assistantEnabled: boolean }) {
  const scanEnabled = scanProvider !== null;
  const [phase, setPhase] = useState<Phase>("landing");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [sensitive, setSensitive] = useState(false);
  const [contact, setContact] = useState({ email: "", phone: "", advisor: true, marketing: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SubmitResult | null>(null);
  const [scanToken, setScanToken] = useState<string | null>(null);
  // Las preguntas de opción única avanzan solas tras una pausa breve, como en el mockup.
  const [autoAdvanceTick, setAutoAdvanceTick] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase, step]);
  useEffect(() => track(distributor.slug, "visita"), [distributor.slug]);
  useEffect(() => {
    if (autoAdvanceTick === 0) return;
    const t = setTimeout(() => setStep((s) => s + 1), 350);
    return () => clearTimeout(t);
  }, [autoAdvanceTick]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const afterQuiz: Phase = scanEnabled ? "scan" : "contact";
  const next = () => (step === STEPS.length - 1 ? setPhase(afterQuiz) : setStep((s) => s + 1));
  const back = () => (step === 0 ? setPhase("consent") : setStep((s) => s - 1));

  if (phase === "landing") {
    return (
      <Landing distributor={distributor} scanEnabled={scanEnabled} assistantEnabled={assistantEnabled} onStart={() => { track(distributor.slug, "inicio"); setPhase("consent"); }} />
    );
  }

  if (phase === "consent") {
    return (
      <Screen
        top={<TopBar onBack={() => setPhase("landing")} progress={0.04} />}
        footer={
          <>
            <PrimaryButton disabled={!sensitive} onClick={() => { setStep(0); setPhase("quiz"); }}>
              Comenzar mi evaluación <ArrowRight />
            </PrimaryButton>
            <p className="mt-2.5 text-center text-[11px] leading-snug text-[#8a8587]">
              Al continuar, aceptas nuestro <PrivacyLink />
            </p>
          </>
        }
      >
        <div className="pt-4">
          <div className="flex size-[52px] items-center justify-center rounded-2xl bg-[#fbeef4]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="#a51959" strokeWidth="1.7" />
              <path d="M8 10V7a4 4 0 018 0v3" stroke="#a51959" strokeWidth="1.7" />
            </svg>
          </div>
          <QuestionHeader
            title="Antes de empezar"
            hint="Te haremos algunas preguntas sencillas sobre tus hábitos para armar una evaluación hecha a tu medida. Esto es solo tuyo:"
          />
          <div className="mt-5 flex flex-col gap-4 rounded-[18px] border border-[var(--line)] bg-white p-[18px]">
            {[
              ["Es solo para ti", "tus respuestas arman tu evaluación, nada más."],
              ["Tú tienes el control", "tu asesor ve tu nombre, tu contacto y el resumen de tu resultado para acompañarte, pero nunca tus condiciones ni medicamentos, y solo te escribe si lo autorizas al final."],
              ["Cambias de opinión cuando quieras", "te las borramos apenas nos lo pidas."],
            ].map(([strong, rest]) => (
              <div key={strong} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e5f8ef] text-[#087748]">
                  <CheckIcon size={15} />
                </span>
                <p className="text-[13px] leading-normal text-[#4a4547]">
                  <strong className="text-[var(--navy)]">{strong}</strong> — {rest}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button" role="checkbox" aria-checked={sensitive} onClick={() => setSensitive((v) => !v)}
            className={cx(
              "press mt-4 flex w-full items-start gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-[border-color,background-color] duration-[140ms]",
              sensitive ? "border-[var(--blue)] bg-[#fbeef4]" : "border-[var(--line)] bg-white",
            )}
          >
            <span
              className={cx(
                "mt-px flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 text-white transition-[background-color,border-color] duration-[140ms]",
                sensitive ? "border-[var(--blue)] bg-[var(--blue)]" : "border-[#d9d2d5] bg-white",
              )}
            >
              <CheckIcon className={cx("transition-[transform,opacity] duration-[140ms]", sensitive ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
            </span>
            <span>
              <span className="block text-[13.5px] font-bold text-[var(--navy)]">Autorizo el uso de mis datos de salud para mi evaluación</span>
              <span className="mt-1 block text-[12px] leading-normal text-[var(--muted)]">
                Te preguntaremos sobre hábitos, condiciones o medicamentos — solo lo justo para que tu resultado sea seguro y preciso para ti.
              </span>
            </span>
          </button>
        </div>
      </Screen>
    );
  }

  if (phase === "contact") {
    const digits = contact.phone.replace(/\D/g, "").length;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) && digits >= 10 && digits <= 15;
    const first = draft.name.trim().split(/\s+/)[0] ?? "";
    const submit = async () => {
      setSubmitting(true);
      setError(null);
      setPhase("analyzing");
      // El análisis es real (el servidor calcula el resultado); la animación dura al menos lo suficiente para leerse.
      const minDelay = new Promise((r) => setTimeout(r, 2800));
      try {
        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            distributorSlug: distributor.slug,
            answers: toAnswers(draft),
            contact: { name: draft.name, email: contact.email, phone: contact.phone },
            consents: { privacy: true, sensitiveData: sensitive, advisorContact: contact.advisor, marketing: contact.marketing },
            ...(scanToken ? { scanToken } : {}),
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as SubmitResult;
        await minDelay;
        setSaved(body);
        setPhase("result");
      } catch {
        setError("No pudimos generar tu resultado. Revisa tu conexión e inténtalo de nuevo.");
        setPhase("contact");
      } finally {
        setSubmitting(false);
      }
    };
    return (
      <Screen
        top={<TopBar onBack={() => setPhase(afterQuiz === "scan" ? "scan" : "quiz")} progress={TOTAL / (TOTAL + 1)} label={`${TOTAL}/${TOTAL}`} />}
        footer={
          <>
            {error && <p role="alert" className="mb-3 rounded-xl bg-[#fdeceb] px-3 py-2 text-[12.5px] font-medium text-[#9a1d17]">{error}</p>}
            <PrimaryButton disabled={!valid || submitting} onClick={submit}>
              Ver mi resultado <ArrowRight />
            </PrimaryButton>
            <p className="mt-2.5 text-center text-[11px] leading-snug text-[#8a8587]">
              Al continuar, aceptas que usemos tus respuestas para generar tu evaluación. <PrivacyLink />
            </p>
          </>
        }
      >
        <QuestionHeader
          title={first ? `${first}, ¿a dónde te enviamos tu resultado?` : "¿A dónde te enviamos tu resultado?"}
          hint="Tu evaluación está casi lista. Te la enviamos completa para que la guardes y la consultes cuando quieras."
        />
        <div className="mt-4 flex flex-col gap-2 rounded-[18px] border border-[#efc9da] bg-[#fbeef4] p-4">
          {[
            "Tu resultado personalizado, en tu correo",
            "Un enlace para volver a verlo cuando quieras",
            `No vendemos tus datos: solo tu asesor, ${distributor.displayName}, ve tu contacto y tu resumen`,
          ].map((t) => (
            <div key={t} className="flex items-start gap-2.5 text-[13px] leading-snug text-[#4a4547]">
              <span className="mt-0.5 text-[var(--green)]"><CheckIcon size={14} /></span>
              {t}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3.5">
          <Field label="Correo electrónico" id="bc-c1" inputMode="email" value={contact.email} placeholder="tu@correo.com"
            onChange={(v) => setContact((c) => ({ ...c, email: v }))} />
          <Field label="WhatsApp" id="bc-c2" inputMode="tel" value={contact.phone} placeholder="10 dígitos"
            onChange={(v) => setContact((c) => ({ ...c, phone: v }))} />
          <p className="-mt-1.5 text-[11.5px] leading-snug text-[var(--muted)]">Tu asesor verá tu nombre y tu contacto, pero solo te escribirá si lo autorizas aquí abajo.</p>
        </div>
        <div className="mt-5 rounded-[18px] border border-[var(--line)] bg-white px-4 pb-1.5">
          <div className="pt-3.5 text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase">Tú decides</div>
          {([
            ["advisor", "💬", "Tu asesor te acompaña", `${distributor.displayName} te ayuda a resolver dudas sobre tu resultado, sin costo`],
            ["marketing", "✦", "Recordatorios y tips de bienestar", "Te recordamos tu kit al día siguiente y te enviamos consejos ocasionales. Te das de baja cuando quieras."],
          ] as const).map(([key, icon, title, subtitle]) => (
            <div key={key} className="flex items-center gap-3 border-t border-[#f2efef] py-3.5 first-of-type:border-t-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fbeef4] text-[15px]" aria-hidden>{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[var(--navy)]">{title}</div>
                <div className="mt-px text-[11.5px] leading-snug text-[var(--muted)]">{subtitle}</div>
              </div>
              <Toggle on={contact[key]} label={title} onClick={() => setContact((c) => ({ ...c, [key]: !c[key] }))} />
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  if (phase === "analyzing") return <Analyzing name={draft.name} />;

  if (phase === "scan") {
    return (
      <ScanStep
        provider={scanProvider!}
        onBack={() => setPhase("quiz")}
        onSkip={() => { setScanToken(null); setPhase("contact"); }}
        onDone={(token) => { setScanToken(token); setPhase("contact"); }}
      />
    );
  }

  if (phase === "result" && saved) {
    return <Result saved={saved} draft={draft} name={draft.name} distributor={distributor} narrationToken={ttsEnabled ? saved.resultToken : null} assistantToken={assistantEnabled ? saved.resultToken : null} storeToken={saved.resultToken ?? null} fresh />;
  }

  const current: Step = STEPS[step];
  const { valid, body } = renderStep(current, draft, set, () => setAutoAdvanceTick((n) => n + 1));

  return (
    <Screen
      top={<TopBar onBack={back} progress={(step + 1) / (TOTAL + 1)} label={`${step + 1}/${TOTAL}`} />}
      footer={<PrimaryButton disabled={!valid} onClick={next}>Continuar <ArrowRight /></PrimaryButton>}
    >
      {body}
    </Screen>
  );
}

function renderStep(
  step: Step,
  d: Draft,
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void,
  autoAdvance: () => void,
): { valid: boolean; body: React.ReactNode } {
  switch (step) {
    case "about": {
      const age = Number(d.age);
      const ageOk = d.age !== "" && Number.isInteger(age) && age >= 18 && age <= 120;
      const minor = d.age !== "" && Number.isInteger(age) && age > 0 && age < 18;
      const needsPregnancy = d.biologicalSex === "female" || d.biologicalSex === "prefer-not";
      return {
        valid: d.name.trim().length >= 2 && ageOk && !!d.biologicalSex && (!needsPregnancy || !!d.pregnancy),
        body: (
          <>
            <QuestionHeader title="Cuéntanos un poco de ti" hint="Con esto personalizamos tu resultado y cuidamos que sea seguro para ti." />
            <SubQuestion title="¿Cómo te llamas?">
              <input
                {...noAutofill} name="bc-nombre" autoCorrect="off" autoCapitalize="words" spellCheck={false} enterKeyHint="next"
                value={d.name} placeholder="Tu nombre" aria-label="Nombre" maxLength={80}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-3 text-[14.5px] outline-none focus:border-[var(--blue)]"
              />
            </SubQuestion>
            <SubQuestion title="¿Qué edad tienes?">
              <input
                {...noAutofill} name="bc-edad" inputMode="numeric" enterKeyHint="next" value={d.age} placeholder="Años" aria-label="Edad"
                onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-3 text-[14.5px] outline-none focus:border-[var(--blue)]"
              />
              {minor && (
                <p role="alert" className="mt-2 rounded-xl bg-[#fff8ec] px-3 py-2 text-[12.5px] text-[#5a4a2e]">
                  WeNow 360 está disponible únicamente para mayores de 18 años.
                </p>
              )}
            </SubQuestion>
            <SubQuestion title="Sexo biológico">
              <Segmented label="Sexo biológico" value={d.biologicalSex} onChange={(v) => set("biologicalSex", v)} options={SEX} />
            </SubQuestion>
            {needsPregnancy && (
              <SubQuestion title="¿Estás embarazada o en periodo de lactancia?">
                <Segmented label="Embarazo o lactancia" value={d.pregnancy} onChange={(v) => set("pregnancy", v)} options={PREGNANCY} />
              </SubQuestion>
            )}
          </>
        ),
      };
    }
    case "body": {
      const h = Number(d.heightCm), w = Number(d.weightKg);
      const filled = d.heightCm !== "" && d.weightKg !== "" && h >= 100 && h <= 250 && w >= 25 && w <= 350;
      return {
        valid: d.skipBody || filled,
        body: (
          <>
            <QuestionHeader title="¿Cuánto mides y pesas?" hint="Un aproximado está bien. Lo usamos solo como contexto general, nunca como diagnóstico." />
            <div className={cx("mt-6 grid grid-cols-2 gap-3 transition-opacity duration-150", d.skipBody && "pointer-events-none opacity-40")}>
              <NumberField label="Estatura" unit="cm" value={d.heightCm} onChange={(v) => set("heightCm", v)} />
              <NumberField label="Peso" unit="kg" value={d.weightKg} onChange={(v) => set("weightKg", v)} />
            </div>
            <div className="mt-4">
              <CheckRow checked={d.skipBody} onClick={() => set("skipBody", !d.skipBody)} label="Prefiero no compartirlo" />
            </div>
          </>
        ),
      };
    }
    case "primary":
      return {
        valid: !!d.primaryGoal,
        body: (
          <>
            <QuestionHeader title="¿Cuál es tu objetivo principal?" hint="Elige la opción que más se acerque a lo que buscas hoy." />
            <div role="radiogroup" aria-label="Objetivo principal" className="mt-5 flex flex-col gap-2.5">
              {PRIMARY_GOALS.map((g) => (
                <OptionCard
                  key={g.id} icon={g.icon} label={g.label} hint={g.hint} selected={d.primaryGoal === g.id}
                  onClick={() => {
                    set("primaryGoal", g.id);
                    set("secondaryGoals", d.secondaryGoals.filter((s) => s !== g.id));
                    autoAdvance();
                  }}
                />
              ))}
            </div>
          </>
        ),
      };
    case "secondary": {
      const toggle = (id: GoalId) =>
        set("secondaryGoals", d.secondaryGoals.includes(id) ? d.secondaryGoals.filter((g) => g !== id) : [...d.secondaryGoals, id]);
      const full = d.secondaryGoals.length >= 2;
      return {
        valid: true,
        body: (
          <>
            <QuestionHeader title="¿Algo más que te gustaría mejorar?" hint="Elige hasta 2 opciones, o ninguna si lo prefieres." />
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {SECONDARY_GOALS.filter(([id]) => id !== d.primaryGoal).map(([id, label]) => (
                <Chip key={id} selected={d.secondaryGoals.includes(id)} disabled={full} onClick={() => toggle(id)}>{label}</Chip>
              ))}
            </div>
          </>
        ),
      };
    }
    case "metrics": {
      const metrics = askedMetrics(d);
      return {
        valid: metrics.every((m) => d.metrics[m] !== null),
        body: (
          <>
            <QuestionHeader title="¿Con qué frecuencia te pasa?" hint="Piensa en las últimas semanas. No hay respuestas buenas ni malas." />
            <div className="mt-5 flex flex-col gap-3">
              {metrics.map((m) => (
                <MetricRow key={m} metric={m} value={d.metrics[m]} onChange={(v) => set("metrics", { ...d.metrics, [m]: v })} />
              ))}
            </div>
          </>
        ),
      };
    }
    case "commitment":
      return {
        valid: !!d.commitment,
        body: (
          <>
            <QuestionHeader title="¿Qué tan list@ estás para empezar un cambio esta semana?" hint="Nos ayuda a acompañarte a tu ritmo." />
            <div role="radiogroup" aria-label="Compromiso" className="mt-5 flex flex-col gap-2.5">
              {COMMITMENT.map((c) => (
                <OptionCard key={c.id} icon={c.icon} label={c.label} hint={c.hint} selected={d.commitment === c.id}
                  onClick={() => { set("commitment", c.id); autoAdvance(); }} />
              ))}
            </div>
          </>
        ),
      };
    case "habits":
      return {
        valid: !!d.sleepHours && !!d.waterGlasses && !!d.produceServings,
        body: (
          <>
            <QuestionHeader title="Tus hábitos de todos los días" />
            <SubQuestion title="¿Cuántas horas duermes normalmente?">
              <Segmented label="Horas de sueño" value={d.sleepHours} onChange={(v) => set("sleepHours", v)} options={SLEEP_HOURS} />
            </SubQuestion>
            <SubQuestion title="¿Cuánta agua simple tomas al día?">
              <Segmented label="Agua al día" value={d.waterGlasses} onChange={(v) => set("waterGlasses", v)} options={WATER} />
            </SubQuestion>
            <SubQuestion title="¿Con qué frecuencia comes frutas y verduras?">
              <Segmented label="Frutas y verduras" value={d.produceServings} onChange={(v) => set("produceServings", v)} options={PRODUCE} />
            </SubQuestion>
          </>
        ),
      };
    case "lifestyle":
      return {
        valid: !!d.activityLevel && !!d.tobacco && !!d.alcohol,
        body: (
          <>
            <QuestionHeader title="Movimiento y estilo de vida" />
            <SubQuestion title="¿Cómo describirías tu actividad física?">
              <div role="radiogroup" aria-label="Actividad física" className="flex flex-col gap-2.5">
                {ACTIVITY.map((a) => (
                  <OptionCard key={a.id} label={a.label} hint={a.hint} selected={d.activityLevel === a.id} onClick={() => set("activityLevel", a.id)} />
                ))}
              </div>
            </SubQuestion>
            <SubQuestion title="¿Fumas?">
              <Segmented label="Tabaco" value={d.tobacco} onChange={(v) => set("tobacco", v)} options={TOBACCO} />
            </SubQuestion>
            <SubQuestion title="¿Consumes alcohol?">
              <Segmented label="Alcohol" value={d.alcohol} onChange={(v) => set("alcohol", v)} options={ALCOHOL} />
            </SubQuestion>
          </>
        ),
      };
    case "safety":
      return {
        valid: !!d.caffeineSensitive && !!d.swallowing,
        body: (
          <>
            <QuestionHeader title="Para cuidarte mejor" hint="Con esto evitamos sugerirte algo que no sea adecuado para ti." />
            <SubQuestion title="¿Eres sensible a la cafeína?">
              <Segmented label="Sensibilidad a cafeína" value={d.caffeineSensitive} onChange={(v) => set("caffeineSensitive", v)} options={YES_NO_UNSURE} />
            </SubQuestion>
            <SubQuestion title="¿Se te dificulta tragar cápsulas?">
              <Segmented label="Tragar cápsulas" value={d.swallowing} onChange={(v) => set("swallowing", v)} options={YES_NO_UNSURE} />
            </SubQuestion>
          </>
        ),
      };
    case "dietary":
      return multiStep(d.dietary, (v) => set("dietary", v), DIETARY, "¿Alguna alergia o restricción alimentaria?", "Selecciona todas las que apliquen.", "Ninguna de las anteriores");
    case "medications": {
      const s = multiStep(d.medications, (v) => set("medications", v), MEDICATIONS, "¿Tomas algún medicamento de forma regular?", "Selecciona todos los que apliquen.", "No utilizo medicamentos regularmente");
      return {
        valid: s.valid,
        body: <>{s.body}<Details value={d.medicationDetails} onChange={(v) => set("medicationDetails", v)} label="¿Algo más que quieras contarnos? (opcional)" /></>,
      };
    }
    case "conditions": {
      const s = multiStep(d.conditions, (v) => set("conditions", v), CONDITIONS, "¿Tienes alguna de estas condiciones?", "Solo diagnosticadas por un profesional. Selecciona todas las que apliquen.", "Ninguna de las anteriores");
      return {
        valid: s.valid,
        body: <>{s.body}<Details value={d.conditionDetails} onChange={(v) => set("conditionDetails", v)} label="¿Algún detalle que debamos considerar? (opcional)" /></>,
      };
    }
  }
}

function multiStep(
  value: string[] | null,
  onChange: (v: string[]) => void,
  options: readonly (readonly [string, string])[],
  title: string,
  hint: string,
  noneLabel: string,
) {
  const none = value !== null && value.length === 0;
  return {
    valid: value !== null,
    body: (
      <>
        <QuestionHeader title={title} hint={hint} />
        <div className="mt-5 flex flex-col gap-2">
          {options.map(([id, label]) => {
            const on = !!value?.includes(id);
            return <CheckRow key={id} checked={on} label={label} onClick={() => onChange(on ? value!.filter((x) => x !== id) : [...(value ?? []), id])} />;
          })}
          <div className="mt-1">
            <CheckRow checked={none} label={noneLabel} onClick={() => onChange([])} />
          </div>
        </div>
      </>
    ),
  };
}

function MetricRow({ metric, value, onChange }: { metric: MetricId; value: number | null; onChange: (v: number) => void }) {
  const copy = METRIC_COPY[metric];
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5">
      <div className="text-[13.5px] font-bold text-[var(--navy)]">{copy.title}</div>
      <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{copy.hint}</div>
      <div role="radiogroup" aria-label={copy.title} className="mt-3 grid grid-cols-4 gap-1.5">
        {(metric === "weight" ? IMPORTANCE_WORDS : FREQUENCY_WORDS).map((word, i) => (
          <button
            key={word} type="button" role="radio" aria-checked={value === i} onClick={() => onChange(i)}
            className={cx(
              "press rounded-[10px] border-[1.5px] px-1 py-2 text-[11.5px] font-semibold transition-[border-color,background-color,color] duration-[140ms]",
              value === i ? "border-[var(--blue)] bg-[var(--blue)] text-white" : "border-[var(--line)] bg-white text-[#4a4547]",
            )}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label, id, value, onChange, inputMode, placeholder,
}: { label: string; id: string; value: string; onChange: (v: string) => void; inputMode: "email" | "tel"; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-bold text-[var(--navy)]">{label}</label>
      <input
        {...noAutofill} id={id} name={id} type="text" inputMode={inputMode} autoCorrect="off" autoCapitalize="none" spellCheck={false}
        enterKeyHint={inputMode === "tel" ? "done" : "next"} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-3 text-[14.5px] text-[var(--ink)] transition-[border-color] duration-[140ms] outline-none placeholder:text-[#b1abae] focus:border-[var(--blue)]"
      />
    </div>
  );
}

function NumberField({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--navy)]">{label}</span>
      <span className="flex items-center rounded-xl border-[1.5px] border-[var(--line)] bg-white pr-3.5 focus-within:border-[var(--blue)]">
        <input
          {...noAutofill} inputMode="decimal" enterKeyHint="next" aria-label={label}
          value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
          className="w-full min-w-0 bg-transparent px-3.5 py-3 text-[14.5px] outline-none"
        />
        <span className="text-[13px] text-[var(--muted)]">{unit}</span>
      </span>
    </label>
  );
}

function Details({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="mt-5 block">
      <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--navy)]">{label}</span>
      <textarea
        {...noAutofill} autoCorrect="on" autoCapitalize="sentences"
        value={value} maxLength={500} rows={3} onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-3 text-[14px] outline-none focus:border-[var(--blue)]"
      />
    </label>
  );
}

const ANALYSIS_STEPS = ["Analizando tus respuestas", "Cruzando tus objetivos con tus hábitos", "Preparando tus recomendaciones"];

function Analyzing({ name }: { name: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setShown((n) => Math.min(n + 1, ANALYSIS_STEPS.length)), 850);
    return () => clearInterval(t);
  }, []);
  const first = name.trim().split(/\s+/)[0] ?? "";
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center bg-[var(--bg)] px-7" role="status" aria-live="polite">
      <div className="relative size-[120px]">
        <svg viewBox="0 0 120 120" className="absolute inset-0 animate-spin [animation-duration:1.6s] motion-reduce:animate-none" aria-hidden>
          <circle cx="60" cy="60" r="52" stroke="#f5e1ea" strokeWidth="6" fill="none" />
          <circle cx="60" cy="60" r="52" stroke="var(--blue)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="230" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="size-3 animate-ping rounded-full bg-[var(--blue-bright)] motion-reduce:animate-none" />
        </span>
      </div>
      <h1 className="mt-7 text-center text-[21px] font-extrabold tracking-[-0.01em] text-[var(--navy)]">
        {first ? `${first}, estamos preparando tu evaluación` : "Estamos preparando tu evaluación"}
      </h1>
      <ul className="mt-5 flex w-full max-w-[280px] flex-col gap-2.5">
        {ANALYSIS_STEPS.map((label, i) => (
          <li
            key={label}
            className={cx(
              "flex items-center gap-2.5 text-[13.5px] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              i < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e5f8ef] text-[#087748]"><CheckIcon size={11} /></span>
            <span className="text-[#4a4547]">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Embudo del distribuidor: una visita y un inicio por pestaña, sin datos personales.
function track(slug: string, kind: "visita" | "inicio") {
  try {
    const key = `bc_${kind}_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  void fetch("/api/funnel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, kind }), keepalive: true }).catch(() => {});
}

function PrivacyLink() {
  return (
    <Link href="/aviso-de-privacidad" target="_blank" className="text-[var(--blue)] underline">Aviso de privacidad</Link>
  );
}
