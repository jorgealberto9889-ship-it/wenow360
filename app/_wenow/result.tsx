"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ResultProduct, SubmitResult } from "@/lib/assessments";
import { BRAND } from "@/lib/brand";
import { MEMBERSHIP_PITCH } from "@/lib/labels";
import type { PriorityLabel } from "@/lib/engine/engine";
import {
  AREAS_INTRO, areaReason, areaStatus, areaWhy, bridgeText, firstName, introText, kitPairs, offerNumbers, productContent, productTip, reasonText, recap,
} from "./copy";
import { Assistant, WinnieInvite } from "./assistant";
import { ClinicalPanel } from "./clinical-panel";
import { IngredientDossier } from "./ingredients";
import { SealsRow } from "./trust";
import { ListenButton, NarrationProvider, sectionAnchor, useNarration } from "./narration";
import type { Distributor, Draft } from "./questions";
import { ActLabel, ArrowRight, Card, CheckCircle, CheckIcon, Chevron, Collapse, cx, initials, money, PrimaryButton, Screen } from "./ui";

type Props = { saved: SubmitResult; draft: Draft; name: string; distributor: Distributor; narrationToken?: string | null; assistantToken?: string | null; storeToken?: string | null; fresh?: boolean };
type Sequences = { act1: string[]; panel: string[]; act2: string[]; act3: string[] };

function sequencesFor(saved: SubmitResult): Sequences {
  const hasProducts = !saved.result.stopped && saved.products.length > 0;
  return {
    act1: ["recap"],
    panel: saved.result.biometric ? ["biometric"] : [],
    act2: ["areas", "analysis", "habits", ...(hasProducts ? ["bridge"] : [])],
    act3: [
      "intro",
      ...(hasProducts ? [...saved.products.map((p) => `product-${p.id}`), "offer"] : []),
    ],
  };
}

function titlesFor(saved: SubmitResult): Record<string, string> {
  return {
    recap: "Lo que nos contaste",
    areas: "Tu resumen de bienestar",
    biometric: "Tu panel de mediciones",
    analysis: "¿Qué significa tu resultado?",
    habits: "Hábitos sugeridos",
    bridge: "Lo que sigue",
    intro: "Tu recomendación personalizada",
    offer: `Tu precio de miembro ${BRAND.club}`,
    ...Object.fromEntries(saved.products.map((p) => [`product-${p.id}`, p.name])),
  };
}

export function Result(props: Props) {
  if (!props.narrationToken) return <ResultFlow {...props} />;
  return (
    <NarrationProvider token={props.narrationToken} titles={titlesFor(props.saved)}>
      <ResultFlow {...props} />
    </NarrationProvider>
  );
}

function ResultFlow(props: Props) {
  const [started, setStarted] = useState(false);
  const [voice, setVoice] = useState(false);
  const narration = useNarration();
  const seq = sequencesFor(props.saved);
  const first = firstName(props.name);

  if (started) return <ResultActs {...props} voice={voice} seq={seq} />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center bg-[var(--bg)] px-7">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#e5f8ef] text-[#087748] motion-safe:animate-[pop_420ms_cubic-bezier(0.23,1,0.32,1)]">
        <CheckIcon size={28} />
      </span>
      <h1 className="mt-5 text-center text-[24px] leading-[1.25] font-extrabold tracking-[-0.015em] text-[var(--navy)]">
        {props.fresh ? `¡Listo${first ? `, ${first}` : ""}! Tu resultado está preparado` : `${first ? `${first}, aquí` : "Aquí"} está tu resultado`}
      </h1>
      {narration ? (
        <>
          <p className="mt-2.5 max-w-[300px] text-center text-[14px] leading-[1.55] text-[var(--muted)]">
            ¿Te lo explico en voz alta? Te acompaño sección por sección mientras lo lees, y puedes pausarlo cuando quieras.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3">
            <PrimaryButton onClick={() => { setVoice(true); setStarted(true); narration.playSequence(seq.act1); }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5L13 8L4 13.5V2.5Z" /></svg>
              Escuchar mi resultado
            </PrimaryButton>
            <button type="button" onClick={() => setStarted(true)} className="press p-1.5 text-[13.5px] font-semibold text-[var(--muted)] underline">
              Prefiero leerlo yo
            </button>
          </div>
        </>
      ) : (
        <div className="mt-7 w-full">
          <PrimaryButton onClick={() => setStarted(true)}>Ver mi resultado <ArrowRight /></PrimaryButton>
        </div>
      )}
    </div>
  );
}

function ResultActs({ saved, draft, name, distributor, voice, seq, assistantToken, storeToken }: Props & { voice: boolean; seq: Sequences }) {
  const [act, setAct] = useState<1 | "panel" | 2 | 3>(1);
  const narration = useNarration();
  const hasProducts = !saved.result.stopped && saved.products.length > 0;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [act]);

  // La reproducción arranca dentro del clic (gesto del usuario) para que el navegador la permita.
  const goTo = (next: "panel" | 2 | 3) => {
    setAct(next);
    if (voice) narration?.playSequence(next === "panel" ? seq.panel : next === 2 ? seq.act2 : seq.act3);
    else narration?.stop();
  };

  if (act === 1) {
    return (
      <Screen fixedFooter footer={<NextButton key="act1" voice={voice} onClick={() => goTo(saved.result.biometric ? "panel" : 2)}>{saved.result.biometric ? "Ver mi panel de mediciones" : "Ver lo que encontramos"}</NextButton>}>
        <ActLabel>Acto 1 de 3 · Antes de tu resultado</ActLabel>
        <ActOne draft={draft} name={name} seq={seq.act1} />
      </Screen>
    );
  }
  if (act === "panel" && saved.result.biometric) {
    return (
      <ClinicalPanel
        bio={saved.result.biometric}
        completedAt={saved.completedAt}
        footer={<NextButton key="panel" voice={voice} onClick={() => goTo(2)}>Ver lo que encontramos</NextButton>}
      />
    );
  }
  const assistant = assistantToken ? (
    <Assistant token={assistantToken} saved={saved} name={name} distributor={distributor} voiceEnabled={false} />
  ) : null;
  if (act === 2) {
    return (
      <Screen fixedFooter footer={<NextButton key="act2" voice={voice} onClick={() => goTo(3)}>{hasProducts ? bridgeText(saved.result.areas).cta : "Ver mis siguientes pasos"}</NextButton>}>
        <ActLabel>Acto 2 de 3 · Lo que encontramos</ActLabel>
        <ActTwo saved={saved} seq={seq.act2} />
      </Screen>
    );
  }
  return (
    <Screen>
      <ActLabel>Acto 3 de 3 · Tu camino</ActLabel>
      <ActThree saved={saved} draft={draft} name={name} distributor={distributor} seq={seq.act3} celia={Boolean(assistantToken)} storeToken={storeToken ?? null} />
      {assistant}
    </Screen>
  );
}

// Botón para pasar al siguiente acto. Cuando termina la narración (o, si se lee sin voz, tras unos
// segundos) se "despierta" con un destello y ondas para invitar a continuar.
const READ_DELAY_MS = 9000;
function NextButton({ voice, onClick, children }: { voice: boolean; onClick: () => void; children: React.ReactNode }) {
  const narration = useNarration();
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), READ_DELAY_MS);
    return () => clearTimeout(t);
  }, []);
  const narrationDone = narration !== null && (narration.state.status === "idle" || narration.state.status === "error");
  const attention = voice && narration ? narrationDone : waited;
  return (
    <div className="relative">
      {attention && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--blue)] motion-safe:animate-[cta-ring_2s_ease-out_infinite]" aria-hidden />
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--blue)] motion-safe:animate-[cta-ring_2s_ease-out_1s_infinite]" aria-hidden />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[var(--navy)] px-3 py-1 text-[11.5px] font-bold whitespace-nowrap text-white shadow-[0_8px_18px_rgba(56,56,56,0.25)] motion-safe:animate-[pop_420ms_cubic-bezier(0.23,1,0.32,1)]">
            Toca para continuar
          </span>
        </>
      )}
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "press relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--blue)] py-4 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(165,25,89,0.26)] transition-transform",
          attention && "motion-safe:animate-[cta-breathe_2s_ease-in-out_infinite]",
        )}
      >
        {attention && (
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] motion-safe:animate-[cta-shine_2.4s_ease-in-out_infinite] motion-reduce:hidden" aria-hidden />
        )}
        <span className="relative">{children}</span>
        <span className={cx("relative", attention && "motion-safe:animate-[cta-nudge_1s_ease-in-out_infinite]")}><ArrowRight /></span>
      </button>
    </div>
  );
}

function ActOne({ draft, name, seq }: { draft: Draft; name: string; seq: string[] }) {
  const r = recap(draft, name);
  return (
    <div id={sectionAnchor("recap")} className="scroll-mt-4">
      <h1 className="pt-1.5 text-[25px] leading-[1.28] font-extrabold tracking-[-0.015em] text-[var(--navy)]">{r.heading}</h1>
      <Card className="mt-5">
        <ListenButton section="recap" sequence={seq} />
        <p className="mt-4 text-[14.5px] leading-[1.65] text-[#4a4547] first:mt-0">
          Nos dijiste que tu prioridad hoy es <strong className="text-[var(--navy)]">{r.primary}</strong>
          {r.secondaryClause}. {r.closing}
        </p>
        <p className="mt-3.5 text-[14.5px] leading-[1.65] text-[#4a4547]">
          {r.notes}
          {r.outro}
        </p>
      </Card>
      <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <span className="text-[var(--green)]"><CheckIcon size={14} /></span>
        Tu esfuerzo por contestar con honestidad es lo que hace posible esto.
      </div>
      <p className="mt-6 text-center text-[13px] font-semibold text-[var(--blue)]">{r.next} ↓</p>
    </div>
  );
}

const RING_COLORS = ["#c71f70", "#a51959", "#e284ab"];
const STATUS_CHIP = ["bg-[#e5f8ef] text-[#087748]", "bg-[#f4f0f2] text-[#5a5456]", "bg-[#fff6df] text-[#916000]", "bg-[#fdeceb] text-[#9a1d17]"];

function Section({ id, title, seq, children, className }: { id: string; title: string; seq: string[]; children: React.ReactNode; className?: string }) {
  return (
    <section id={sectionAnchor(id)} className="scroll-mt-4">
      <Card className={className}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-extrabold text-[var(--navy)]">{title}</h2>
          <ListenButton section={id} sequence={seq} />
        </div>
        {children}
      </Card>
    </section>
  );
}

function ActTwo({ saved, seq }: { saved: SubmitResult; seq: string[] }) {
  const { result } = saved;
  const hasProducts = !result.stopped && saved.products.length > 0;
  const bridge = bridgeText(result.areas);

  return (
    <div className="flex flex-col gap-5">
      <p className="px-0.5 text-[14px] leading-[1.55] text-[#4a4547] italic">
        “No es falta de disciplina — es que tu rutina de hoy no le está dando a tu cuerpo el apoyo correcto.”
      </p>

      <Section id="areas" title="Tu resumen de bienestar" seq={seq}>
        <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[var(--muted)]">{AREAS_INTRO}</p>
        <div className="mt-4 flex justify-between gap-1.5" aria-hidden>
          {result.areas.map((area, i) => (
            <div key={area.title} className="flex flex-1 flex-col items-center gap-1.5">
              <svg width="72" height="72" viewBox="0 0 92 92">
                <circle cx="46" cy="46" r="39" stroke="#f5e1ea" strokeWidth="7" fill="none" />
                <circle
                  cx="46" cy="46" r="39" stroke={RING_COLORS[i]} strokeWidth="7" fill="none" strokeLinecap="round"
                  strokeDasharray="245" strokeDashoffset={245 * (1 - (area.score + 1) / 4)} transform="rotate(-90 46 46)"
                />
              </svg>
              <span className="text-center text-[12px] leading-tight font-bold text-[var(--navy)]">{area.title}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {result.areas.map((area) => (
            <div key={area.title} className="rounded-2xl bg-[#f8f4f6] p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] font-extrabold text-[var(--navy)]">{area.title}</span>
                <span className={cx("rounded-full px-2 py-0.5 text-[10.5px] font-bold", STATUS_CHIP[area.score])}>{areaStatus(area)}</span>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[#4a4547]">{areaReason(area)}</p>
              <p className="mt-1 text-[12.5px] leading-[1.55] text-[var(--muted)]"><strong className="font-semibold text-[#4a4547]">Por qué importa:</strong> {areaWhy(area)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="analysis" title="¿Qué significa tu resultado?" seq={seq}>
        <div className="mt-3 flex flex-col gap-3">
          {result.analysisSummary.map((p) => (
            <p key={p} className="text-[13px] leading-[1.6] text-[#4a4547]">{p}</p>
          ))}
        </div>
      </Section>

      <Section id="habits" title="Hábitos sugeridos" seq={seq}>
        <p className="mt-2.5 text-[13px] leading-normal text-[var(--muted)]">Pocas acciones, concretas, que puedes empezar esta semana.</p>
        <div className="mt-4 flex flex-col gap-4">
          {result.habits.map((h, i) => (
            <div key={h.title} className="flex items-start gap-3">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#fbeef4] text-[12px] font-extrabold text-[var(--blue)]">{i + 1}</span>
              <div>
                <div className="text-[13.5px] font-bold text-[var(--navy)]">{h.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-normal text-[#4a4547]">{h.detail}</div>
                <div className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-[#087748]"><CheckCircle />{h.benefit}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {hasProducts && (
        <section id={sectionAnchor("bridge")} className="scroll-mt-4 rounded-[22px] bg-[linear-gradient(135deg,var(--blue),var(--navy))] p-5 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[16px] font-extrabold">{bridge.title}</div>
            <ListenButton section="bridge" sequence={seq} />
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#f3dbe6]">{bridge.body}</p>
        </section>
      )}
    </div>
  );
}

const LINE_LABEL: Record<ResultProduct["line"], string> = { nutriday_plus: "NUTRIDAY PLUS", club_wenow: "CLUB WENOW" };
const PRIORITY_STYLE: Record<PriorityLabel, { label: string; className: string }> = {
  esencial: { label: "ESENCIAL", className: "bg-[#e5f8ef] text-[#087748]" },
  prioritaria: { label: "PRIORITARIA", className: "bg-[#fff6df] text-[#916000]" },
  complementaria: { label: "COMPLEMENTARIA", className: "bg-[#f4f0f2] text-[#5a5456]" },
};

function ActThree({ saved, draft, name, distributor, seq, celia, storeToken }: { saved: SubmitResult; draft: Draft; name: string; distributor: Distributor; seq: string[]; celia: boolean; storeToken: string | null }) {
  const { result, products } = saved;
  const priority = new Map(result.recommendations.map((r) => [r.productId, r.priorityLabel]));
  const recs = new Map(result.recommendations.map((r) => [r.productId, r]));
  const careNotes = [...(result.medicalAttention && !result.medicalAttention.critical ? [result.medicalAttention.detail] : []), ...result.reviewNotes];
  const [allBenefits, setAllBenefits] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(products.map((p) => [p.id, true])));
  const [openId, setOpenId] = useState<string | null>(products[0]?.id ?? null);

  const totals = useMemo(() => {
    const sel = products.filter((p) => checked[p.id]);
    return { sel, ...offerNumbers(sel) };
  }, [checked, products]);

  const kitNames = totals.sel.map((p) => p.name).join(", ");
  const waBuyHref = `https://wa.me/${distributor.whatsapp}?text=${encodeURIComponent(
    `Hola ${distributor.displayName}, terminé mi evaluación ${BRAND.name} y quiero mi precio de miembro. Mi kit: ${kitNames}. Total miembro: ${money(totals.pay)}.`,
  )}`;
  // La tienda lleva al asesor que atendió la evaluación. Sin enlace firmado (no debería pasar) se atiende por WhatsApp.
  const buyHref = storeToken ? `/tienda/${storeToken}` : waBuyHref;

  if (result.stopped || products.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <section id={sectionAnchor("intro")} className="scroll-mt-4">
          <Card>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[18px] font-extrabold text-[var(--navy)]">{result.headline}</h2>
              <ListenButton section="intro" sequence={seq} />
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-[#4a4547]">{result.explanation}</p>
            {result.medicalAttention && (
              <p className="mt-3 rounded-xl bg-[#fbeef4] px-3.5 py-3 text-[13px] leading-[1.55] text-[#4a4547]">
                <strong className="text-[var(--navy)]">{result.medicalAttention.title}.</strong> {result.medicalAttention.detail}
              </p>
            )}
          </Card>
        </section>
        <Advisor distributor={distributor} />
        <Disclaimer />
      </div>
    );
  }

  const pctOfPublic = totals.pub ? Math.round((totals.pay / totals.pub) * 100) : 100;

  return (
    <div className="flex flex-col gap-[18px]">
      <section id={sectionAnchor("intro")} className="scroll-mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">Tu recomendación personalizada</h1>
          <ListenButton section="intro" sequence={seq} />
        </div>
        <p className="mt-2 text-[14px] leading-[1.6] text-[#4a4547]">{introText(result.areas, name)}</p>
        <p className="mt-2 text-[12.5px] leading-normal text-[var(--muted)]">Lo esencial primero, lo complementario después.</p>
      </section>

      <div className="flex flex-col gap-3">
        {products.map((p, i) => {
          const pr = PRIORITY_STYLE[priority.get(p.id) ?? "complementaria"];
          const on = !!checked[p.id];
          const open = openId === p.id;
          return (
            <article key={p.id} id={sectionAnchor(`product-${p.id}`)} className={cx("scroll-mt-4 rounded-[18px] border border-[var(--line)] bg-white p-4 transition-opacity duration-150", !on && "opacity-60")}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-[#b1abae]">0{i + 1}</span>
                <span className={cx("rounded-full px-2.5 py-[3px] text-[9.5px] font-extrabold tracking-[0.03em]", pr.className)}>{i + 1}. {pr.label}</span>
                <span className="text-[9.5px] font-bold tracking-[0.03em] text-[#b1abae]">{LINE_LABEL[p.line]}</span>
                <span className="ml-auto"><ListenButton section={`product-${p.id}`} sequence={seq} /></span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button" role="checkbox" aria-checked={on} aria-label={`Incluir ${p.name} en mi kit`}
                  onClick={() => setChecked((c) => ({ ...c, [p.id]: !on }))}
                  className={cx("press flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 text-white", on ? "border-[var(--blue)] bg-[var(--blue)]" : "border-[#d9d2d5] bg-white")}
                >
                  <CheckIcon size={12} className={cx("transition-[transform,opacity] duration-[140ms]", on ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
                </button>
                <span className="flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#fbeef4]">
                  {p.imageUrl && <Image src={p.imageUrl} alt="" width={72} height={72} className="h-[52px] w-auto object-contain" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold tracking-[0.03em] text-[var(--blue)] uppercase">{p.eyebrow}</div>
                  <div className="text-[14px] font-extrabold text-[var(--navy)]">{p.name}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[14px] font-extrabold text-[var(--navy)]">{money(p.publicPrice)}</div>
                  <div className="text-[9.5px] text-[#8a8587]">precio público</div>
                  <div className="mt-0.5 inline-block rounded-full bg-[#e5f8ef] px-2 py-0.5 text-[10px] font-bold text-[#087748]">{money(p.distributorPrice)} miembro</div>
                </div>
              </div>

              {reasonText(recs.get(p.id)) && (
                <p className="mt-3 rounded-xl bg-[#f8f4f6] px-3 py-2.5 text-[12.5px] leading-snug text-[#4a4547]">
                  <strong className="font-bold text-[var(--navy)]">Por qué para ti:</strong> {reasonText(recs.get(p.id)).replace("Te lo recomendamos por ", "")}
                </p>
              )}
              {productTip(p.id, draft) && (
                <p className="mt-2 text-[12px] leading-snug font-semibold text-[#916000]">💡 {productTip(p.id, draft)}</p>
              )}
              <div className="mt-3 border-t border-[#f8edf2] pt-3">
                <div className="text-[11px] font-bold tracking-[0.04em] text-[var(--blue)] uppercase">Cómo puede apoyarte</div>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#4a4547]">{productContent(p).summary}</p>
              </div>
              {productContent(p).catalog.length > 0 ? (
                <div className="mt-3">
                  <div className="mb-2 text-[10px] font-bold tracking-[0.05em] text-[#8a8587] uppercase">Beneficios · catálogo {BRAND.shortName}</div>
                  <ul className="flex flex-col gap-2">
                    {(allBenefits[p.id] ? productContent(p).catalog : productContent(p).catalog.slice(0, 4)).map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle />
                        <span className="text-[12.5px] leading-snug text-[#4a4547]">{b}</span>
                      </li>
                    ))}
                  </ul>
                  {productContent(p).catalog.length > 4 && (
                    <button type="button" onClick={() => setAllBenefits((m) => ({ ...m, [p.id]: !m[p.id] }))} className="press mt-2 text-[11.5px] font-bold text-[var(--blue)]">
                      {allBenefits[p.id] ? "Ver menos" : `Ver los ${productContent(p).catalog.length} beneficios`}
                    </button>
                  )}
                </div>
              ) : (
                productContent(p).benefits.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 text-[10px] font-bold tracking-[0.05em] text-[#8a8587] uppercase">Lo que puede aportarte</div>
                    <ul className="flex flex-col gap-2.5">
                      {productContent(p).benefits.map((b) => (
                        <li key={b.title} className="flex items-start gap-2">
                          <CheckCircle />
                          <span className="text-[12.5px] leading-snug text-[#4a4547]">
                            <strong className="font-bold text-[var(--navy)]">{b.title}.</strong> {b.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)} className="press mt-3 flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--blue)]">
                Cómo tomarlo, ingredientes y consideraciones <Chevron open={open} />
              </button>
              <Collapse open={open}>
                <div className="mt-3 flex flex-col gap-2.5">
                  <div className="rounded-xl border border-[var(--line)] p-3">
                    <div className="mb-2 text-[11px] font-bold text-[var(--navy)]">Cómo tomarlo</div>
                    {productContent(p).ficha && productContent(p).ficha!.ritual.filter(([, t]) => !t.startsWith("[")).length > 0 ? (
                      <ol className="flex flex-col gap-2">
                        {productContent(p).ficha!.ritual.filter(([, t]) => !t.startsWith("[")).map(([step, text], j) => (
                          <li key={step} className="flex items-start gap-2.5">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#fbeef4] text-[10.5px] font-extrabold text-[var(--blue)]">{j + 1}</span>
                            <p className="text-[12px] leading-normal text-[#4a4547]"><strong className="font-bold text-[var(--navy)]">{step}.</strong> {text}</p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-[12px] leading-normal text-[#4a4547]">{p.usage}</p>
                    )}
                    {productContent(p).ficha?.ritual_note && <p className="mt-2 text-[11.5px] leading-normal text-[var(--muted)]">{productContent(p).ficha!.ritual_note}</p>}
                  </div>
                  {kitPairs(p, products).length > 0 && (
                    <div className="rounded-xl bg-[#fbeef4] p-3">
                      <div className="mb-1 text-[11px] font-bold text-[var(--navy)]">En tu kit, combina bien con</div>
                      {kitPairs(p, products).map((x) => (
                        <p key={x.name} className="text-[12px] leading-normal text-[#4a4547]"><strong className="font-bold text-[var(--navy)]">{x.name}</strong> · {x.text}</p>
                      ))}
                    </div>
                  )}
                  {(productContent(p).ficha
                    ? [["Consideraciones", p.note]]
                    : [["Ingredientes destacados", p.ingredients], ["Consideraciones", p.note]]
                  ).map(([t, v]) => (
                    <div key={t}>
                      <div className="mb-0.5 text-[11px] font-bold text-[var(--navy)]">{t}</div>
                      <p className="text-[12px] leading-normal text-[var(--muted)]">{v}</p>
                    </div>
                  ))}
                  {productContent(p).ficha && <IngredientDossier productId={p.id} ficha={productContent(p).ficha!} />}
                </div>
              </Collapse>
            </article>
          );
        })}
        <p className="px-0.5 text-[11px] leading-normal text-[#8a8587]">
          Cada persona responde distinto. Lo que describimos se basa en la función de los ingredientes y en los estudios publicados sobre ellos — no es una promesa de resultado.
        </p>
      </div>

      {totals.sel.length > 0 && (
        <>
          <div id={sectionAnchor("offer")} className="scroll-mt-4 pt-1.5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[21px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">Mismo kit, dos precios</h2>
              <ListenButton section="offer" sequence={seq} />
            </div>
            <p className="mt-1.5 text-[13px] leading-normal text-[var(--muted)]">{MEMBERSHIP_PITCH}. Los productos son exactamente los mismos; lo único que cambia es cuánto pagas.</p>
          </div>

          <div className="rounded-[22px] border border-[var(--line)] bg-white px-5 py-[18px]">
            <div className="text-[10.5px] font-bold tracking-[0.06em] text-[#8a8587] uppercase">A precio público</div>
            <div className="mt-3 flex flex-col gap-[7px]">
              {totals.sel.map((p) => (
                <div key={p.id} className="flex justify-between text-[12.5px]">
                  <span className="text-[var(--muted)]">{p.name}</span>
                  <span className="font-semibold text-[#4a4547]">{money(p.publicPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-[var(--line)] pt-3">
              <span className="text-[13px] font-bold text-[#4a4547]">Lo que pagarías normalmente</span>
              <span className="text-[22px] font-extrabold text-[#4a4547]">{money(totals.pub)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-1">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="text-[12px] font-bold text-[var(--blue)]">Pero no tienes que pagar eso</span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <div className="relative rounded-[22px] border-2 border-[var(--blue)] bg-[linear-gradient(180deg,var(--blue-soft)_0%,#ffffff_55%)] p-5 shadow-[0_18px_44px_rgba(165,25,89,0.16)]">
            <span className="absolute -top-[11px] right-[18px] rounded-full bg-[var(--blue)] px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.06em] text-white">LA MEJOR OPCIÓN</span>
            <div className="text-[10.5px] font-bold tracking-[0.06em] text-[var(--blue)] uppercase">Precio miembro {BRAND.club}</div>
            <div className="mt-1 text-[16px] leading-snug font-extrabold text-[var(--navy)]">{totals.pct}% menos en tus {totals.sel.length} producto{totals.sel.length > 1 && "s"}</div>
            <div className="mt-3.5 flex flex-col gap-2.5 text-[12.5px]">
              {totals.sel.map((p) => (
                <PriceRow key={p.id} label={p.name} from={p.publicPrice} to={p.distributorPrice} />
              ))}
              <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-2.5">
                <span className="text-[13px] font-bold text-[var(--navy)]">Tu total</span>
                <span className="text-[24px] font-extrabold tracking-[-0.01em] text-[var(--navy)]">{money(totals.pay)}</span>
              </div>
            </div>
            <div className="mt-3.5 flex flex-col gap-1.5" aria-hidden>
              <div className="flex items-center gap-2"><span className="w-[70px] text-[10px] font-semibold text-[#8a8587]">Público</span><span className="h-2.5 flex-1 rounded-full bg-[var(--line)]" /></div>
              <div className="flex items-center gap-2">
                <span className="w-[70px] text-[10px] font-bold text-[var(--blue)]">Miembro</span>
                <span className="relative h-2.5 flex-1 rounded-full bg-[repeating-linear-gradient(135deg,#bfeed6_0_4px,#e5f8ef_4px_8px)]">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--blue)]" style={{ width: `${pctOfPublic}%` }} />
                </span>
              </div>
            </div>
            <div className="mt-3.5 rounded-2xl bg-[#0b8f55] p-4 text-center">
              <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#bff0d6]">TE AHORRAS</div>
              <div className="mt-0.5 text-[34px] leading-[1.1] font-extrabold tracking-[-0.02em] text-white">{money(totals.savings)}</div>
              <div className="mt-1 text-[12px] leading-snug text-[#e2f8ec]">{totals.pct}% menos que a precio público, por exactamente los mismos productos.</div>
            </div>
            <a href={buyHref} target="_blank" rel="noopener noreferrer" className="press mt-4 flex items-center justify-center gap-2 rounded-full bg-[var(--blue)] py-4 text-[15.5px] font-extrabold text-white shadow-[0_14px_30px_rgba(165,25,89,0.28)]">
              Comprar ahora <ArrowRight />
            </a>
            <p className="mt-2 text-center text-[11.5px] leading-snug text-[var(--muted)]">
              Se abre la tienda de {BRAND.shortName}. {distributor.displayName} queda registrado como tu asesor.
            </p>
          </div>

          <a href={waBuyHref} target="_blank" rel="noopener noreferrer" className="press flex items-center justify-center rounded-full border-[1.5px] border-[var(--whatsapp)] bg-white py-3 text-[13.5px] font-bold text-[#0d9a56]">
            Hablar con mi asesor por WhatsApp
          </a>
        </>
      )}

      {celia && <WinnieInvite advisor={distributor.displayName} />}

      <Faq store={Boolean(storeToken)} advisor={distributor.displayName} />

      <SealsRow />

      <Advisor distributor={distributor} />
      {careNotes.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
          <div className="text-[11.5px] font-bold text-[var(--navy)]">Una nota para cuidarte</div>
          {careNotes.map((n) => (
            <p key={n} className="mt-1 text-[11.5px] leading-normal text-[var(--muted)]">{n}</p>
          ))}
        </div>
      )}
      <Disclaimer />
    </div>
  );
}

function PriceRow({ label, from, to, red }: { label: React.ReactNode; from: number; to: number; red?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[#4a4547]">{label}</span>
      <span>
        <span className="mr-1.5 text-[#b1abae] line-through">{money(from)}</span>
        <b className={red ? "text-[var(--red)]" : "text-[var(--navy)]"}>{money(to)}</b>
      </span>
    </div>
  );
}

function Faq({ store, advisor }: { store: boolean; advisor: string }) {
  const items: [string, string][] = [
    ["¿Son compatibles con lo que ya tomo?", "Son suplementos alimenticios, pensados para acompañar tu bienestar. Aun así, si tomas algún medicamento, coméntalo con tu asesor y con el profesional que te da seguimiento."],
    ["¿Cómo hago mi compra?", store
      ? `Toca «Comprar ahora» para ir a la tienda de ${BRAND.shortName}. ${advisor} queda registrado como tu asesor. Si lo prefieres, también te atiende por WhatsApp.`
      : `${advisor} te atiende por WhatsApp: confirma contigo tu kit, tu precio de miembro y la forma de pago.`],
    ["¿Qué es el precio miembro?", `Es el precio de los integrantes del ${BRAND.club}: pagas menos por exactamente los mismos productos. ${advisor} te explica cómo ser miembro.`],
  ];
  return (
    <section>
      <h2 className="px-0.5 text-[13px] font-extrabold text-[var(--navy)]">Preguntas frecuentes</h2>
      <dl className="mt-3 flex flex-col gap-3.5">
        {items.map(([q, a]) => (
          <div key={q}>
            <dt className="text-[12.5px] font-bold text-[var(--navy)]">{q}</dt>
            <dd className="mt-0.5 text-[12.5px] leading-snug text-[var(--muted)]">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Advisor({ distributor }: { distributor: Distributor }) {
  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={`https://wa.me/${distributor.whatsapp}`} target="_blank" rel="noopener noreferrer"
        className="press flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--whatsapp)] bg-white py-3 text-[13.5px] font-bold text-[#0d9a56]"
      >
        Hablar con tu asesor
      </a>
      <div className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(56,56,56,0.06)]">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--blue),var(--navy))] text-[13px] font-bold text-white">
          {initials(distributor.displayName)}
        </span>
        <div>
          <div className="text-[13.5px] font-bold text-[var(--navy)]">{distributor.displayName}</div>
          <div className="text-[12px] text-[var(--muted)]">Tu asesor WeNow</div>
        </div>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="px-2 text-center text-[11px] leading-normal text-[#8a8587]">
      Este resultado es informativo y no sustituye la valoración de un profesional de salud. Los productos sugeridos no son medicamentos.
    </p>
  );
}
