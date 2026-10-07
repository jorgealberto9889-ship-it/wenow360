"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { memberDiscountPct } from "@/lib/labels";
import { Ring360 } from "./ring";
import { OPEN_WINNIE_EVENT, WinnieOrb } from "./winnie-orb";
import { RppgSection } from "./rppg";
import { MemberTools } from "./member-tools";
import { QualitySeals } from "./trust";
import { WinniePublic } from "./winnie-public";
import type { Distributor } from "./questions";
import { CheckIcon, initials } from "./ui";

// Solo imágenes (sin nombres ni precios): la portada invita, el resultado recomienda.
const SHOWCASE = [
  { src: "/assets/products/green-plus.webp", alt: "Green Plus" },
  { src: "/assets/products/regenerex.webp", alt: "RegeneREX" },
  { src: "/assets/products/purebody.webp", alt: "PureBody" },
  { src: "/assets/products/neuro-chai.webp", alt: "Neuro CHAI" },
  { src: "/assets/products/collagen-woman.webp", alt: "Collagen Woman" },
  { src: "/assets/products/resnad.webp", alt: "ResNAD" },
  { src: "/assets/products/active-burn.webp", alt: "Active Burn+" },
  { src: "/assets/products/nutriday-red.webp", alt: "NutriDay Plus Red" },
  { src: "/assets/products/nk-plus.webp", alt: "NK+" },
  { src: "/assets/products/synergy.webp", alt: "Synergy" },
  { src: "/assets/products/antiox.webp", alt: "AntiOX" },
  { src: "/assets/products/collagen-man.webp", alt: "Collagen Man" },
  { src: "/assets/products/transfactor.webp", alt: "TransFactor" },
  { src: "/assets/products/nutriday-brown.webp", alt: "NutriDay Plus Brown" },
  { src: "/assets/products/endo.webp", alt: "ENDO CBD Oil" },
];

const { publicPrice: EXAMPLE_PUBLIC, memberPrice: EXAMPLE_MEMBER } = BRAND.memberExample;
const EXAMPLE_PCT = memberDiscountPct(EXAMPLE_PUBLIC, EXAMPLE_MEMBER);

const wa = (d: Distributor, text: string) => `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(text)}`;

export function Landing({
  distributor, scanEnabled, assistantEnabled, onStart,
}: {
  distributor: Distributor;
  scanEnabled: boolean;
  assistantEnabled: boolean;
  onStart: () => void;
}) {
  const steps = [
    {
      n: "01", title: "Responde",
      text: "Un cuestionario breve sobre tus hábitos, tu contexto y lo que quieres mejorar.",
      icon: <path d="M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />,
    },
    {
      n: "02", title: "Analizamos",
      text: scanEnabled
        ? "Cruzamos tus respuestas con tus objetivos y, si quieres, sumamos una lectura facial de menos de un minuto."
        : "Cruzamos tus respuestas con tus objetivos para encontrar tus áreas de oportunidad.",
      icon: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    },
    {
      n: "03", title: "Recibe orientación",
      text: assistantEnabled
        ? `Tu resultado en pantalla, hábitos prácticos, productos sugeridos y ${BRAND.assistantName} para resolver tus dudas.`
        : "Tu resultado en pantalla, hábitos prácticos y los productos que pueden acompañarte.",
      icon: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
    },
  ];

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[var(--bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)]/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" aria-label="WeNow 360 · inicio"><Image src="/assets/wenow-360-logo.png" alt="WeNow 360" width={1259} height={1132} priority className="h-11 w-auto lg:h-12" /></Link>
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-[#4a4547] md:flex">
            <a href="#como-funciona" className="hover:text-[var(--navy)]">Cómo funciona</a>
            <a href="#tecnologia" className="hover:text-[var(--navy)]">Tecnología</a>
            <a href="#winnie" className="hover:text-[var(--navy)]">Winnie</a>
            <a href="#productos" className="hover:text-[var(--navy)]">Productos</a>
            <a href="#calidad" className="hover:text-[var(--navy)]">Calidad</a>
            <a href="#membresia" className="hover:text-[var(--navy)]">Precio miembro</a>
            <a href="#herramientas" className="hover:text-[var(--navy)]">Para miembros</a>
            <Link href="/aviso-de-privacidad" className="hover:text-[var(--navy)]">Privacidad</Link>
          </nav>
          <button onClick={onStart} className="press rounded-full bg-[var(--navy)] px-4 py-2 text-[13px] font-bold text-white">
            Comenzar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(60%_50%_at_85%_25%,rgba(165,25,89,0.10),transparent_70%),radial-gradient(40%_40%_at_5%_90%,rgba(163,162,162,0.18),transparent_70%)]" />
        {/* En celular: textos → imagen → beneficios → botón → asesor. En escritorio: dos columnas. */}
        <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)] gap-8 px-5 pt-10 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-12 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="contents lg:block lg:animate-[sheet_600ms_ease-out_both]">
            <div className="order-1 animate-[sheet_600ms_ease-out_both] lg:animate-none">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#efc9da] bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase shadow-[0_6px_18px_rgba(56,56,56,0.06)]">
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--blue)]" />
                {BRAND.club} · Evaluación personalizada
              </span>
              <h1 className="mt-5 text-[clamp(36px,12.5vw,48px)] leading-[1.02] font-extrabold tracking-[-0.035em] text-[var(--navy)] sm:text-[58px] lg:text-[70px]">
                Mira tu bienestar en <span className="text-[var(--blue)]">360°</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-[19px] leading-[1.4] font-semibold tracking-[-0.01em] text-[var(--navy)] lg:text-[22px]">
                Descubre tus áreas de oportunidad y los productos NutriDay Plus que mejor encajan contigo.
              </p>
              <p className="mt-3 max-w-[500px] text-[15px] leading-[1.6] text-[#4d4749]">
                Responde un cuestionario breve y recibe una orientación personalizada, basada en tus hábitos, tu contexto y tus objetivos.
              </p>
            </div>

            <div className="order-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5 lg:order-none lg:mt-8">
              <StartButton onClick={onStart}>Comenzar análisis gratis</StartButton>
              <span className="flex items-center justify-center gap-2 text-center text-[13px] text-[var(--muted)] sm:justify-start sm:whitespace-nowrap">
                <ClockIcon /> Toma aproximadamente 3 minutos
              </span>
            </div>

            <div className="order-4 lg:mt-9">
              <AdvisorCard distributor={distributor} />
            </div>
          </div>

          <div className="order-3 flex flex-col gap-5 lg:order-none">
            <HeroVisual />
            <div className="lg:hidden"><TrustList /></div>
          </div>
        </div>

        {/* Confianza (escritorio) */}
        <div className="relative mx-auto hidden w-full max-w-[1180px] px-5 pb-4 lg:block lg:px-8">
          <TrustList />
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
        <SectionTitle eyebrow="Cómo funciona" title="Conoce tu bienestar en solo tres pasos" />
        <ol className="mt-9 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((s) => (
            <li key={s.n} className="group relative overflow-hidden rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(56,56,56,0.05)] transition-transform duration-300 hover:-translate-y-1">
              <span className="pointer-events-none absolute -top-4 -right-1 font-mono text-[76px] leading-none font-semibold text-[#f9f0f4]">{s.n}</span>
              <span className="relative flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--blue-bright),var(--navy))] text-white shadow-[0_10px_22px_rgba(165,25,89,0.28)]">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{s.icon}</svg>
              </span>
              <h3 className="relative mt-5 text-[19px] font-semibold tracking-[-0.01em] text-[var(--navy)]">{s.title}</h3>
              <p className="relative mt-2 text-[14px] leading-[1.6] text-[#4d4749]">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Tecnología rPPG */}
      <RppgSection>
        <StartButton onClick={onStart}>Comenzar análisis gratis</StartButton>
      </RppgSection>

      {/* Quién es Winnie */}
      <section id="winnie" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-8 rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-[0_24px_50px_rgba(56,56,56,0.06)] lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:p-12">
          <div>
            <span className="text-[11.5px] font-bold tracking-[0.1em] text-[var(--blue)] uppercase">Conoce a {BRAND.assistantName}</span>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--navy)] lg:text-[42px]">{BRAND.assistantName} te acompaña desde el primer clic</h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[#4d4749]">
              {BRAND.assistantName} es el asistente virtual de {BRAND.shortName}, con inteligencia artificial. Está disponible desde esta página, antes y después de tu evaluación.
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {[
                ["Resuelve tus dudas", `Sobre ${BRAND.name}, los productos y sus ingredientes, cuando quieras.`],
                ["Te orienta con hábitos", "Ideas sencillas de sueño, alimentación y movimiento para lo que te preocupa."],
                ["Te acompaña en tu resultado", "Después de tu evaluación te ayuda a entenderlo y a elegir con calma."],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f9e9f1] text-[var(--blue)]"><CheckIcon size={12} /></span>
                  <span className="text-[14px] leading-[1.5] text-[#4d4749]"><strong className="font-bold text-[var(--navy)]">{t}.</strong> {d}</span>
                </li>
              ))}
            </ul>
            {assistantEnabled && (
              <button
                type="button" onClick={() => window.dispatchEvent(new Event(OPEN_WINNIE_EVENT))}
                className="press mt-7 inline-flex items-center gap-2.5 rounded-full bg-[var(--navy)] py-2.5 pr-5 pl-2.5 text-[14px] font-bold text-white"
              >
                <WinnieOrb size={34} /> Hablar con {BRAND.assistantName}
              </button>
            )}
            <p className="mt-4 max-w-[480px] text-[11.5px] leading-[1.55] text-[#8a8587]">
              {BRAND.assistantName} es una inteligencia artificial y puede equivocarse: no diagnostica ni sustituye a tu médico. Si tienes síntomas graves, busca atención médica de inmediato.
            </p>
          </div>

          {/* Ejemplo de conversación */}
          <div className="relative">
            <Ring360 animate={false} className="pointer-events-none absolute -top-10 -right-10 size-[220px] opacity-[0.14]" />
            <div className="relative rounded-[26px] bg-[var(--bg)] p-5 ring-1 ring-[var(--line)] lg:p-6">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                <WinnieOrb size={44} animated />
                <div>
                  <div className="text-[15px] font-extrabold text-[var(--navy)]">{BRAND.assistantName}</div>
                  <div className="text-[11.5px] text-[var(--muted)]">Asistente virtual de {BRAND.shortName}</div>
                </div>
                <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] text-[var(--muted)] uppercase ring-1 ring-[var(--line)]">Ejemplo</span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <p className="max-w-[85%] self-end rounded-2xl rounded-tr-md bg-[var(--blue)] px-4 py-3 text-[13.5px] leading-[1.5] text-white">Duermo mal y estoy muy estresada. ¿Qué me recomiendas?</p>
                <p className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[13.5px] leading-[1.55] text-[#4a4547] ring-1 ring-[var(--line)]">
                  Te entiendo. Para empezar ayudan hábitos como un horario fijo para dormir y bajar las pantallas una hora antes. Entre los productos, NK+ incluye L-triptófano, precursor de la serotonina y la melatonina, y valeriana, una planta usada tradicionalmente para relajarse. ¿Te cuento cómo actúa cada uno?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section id="productos" className="scroll-mt-20 pt-16 lg:pt-24">
        <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <SectionTitle
            eyebrow="NutriDay Plus"
            title="Quince productos, tu combinación"
            text="Cada fórmula apoya un objetivo distinto. No tienes que adivinar cuál elegir: al terminar tu evaluación te sugerimos solo los que encajan con tu perfil."
          />
          <p className="text-[13px] font-semibold tracking-[0.02em] text-[var(--muted)] lg:text-right">{BRAND.motto}</p>
        </div>
        <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <ul className="flex w-max animate-[marquee_65s_linear_infinite] gap-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none lg:gap-5">
            {[...SHOWCASE, ...SHOWCASE].map((p, i) => (
              <li
                key={i} aria-hidden={i >= SHOWCASE.length}
                className="flex h-[220px] w-[190px] shrink-0 items-center justify-center rounded-[26px] border border-[var(--line)] bg-[radial-gradient(circle_at_50%_65%,#ffffff,#f1ecee_80%)] shadow-[0_12px_30px_rgba(56,56,56,0.05)] lg:h-[260px] lg:w-[220px]"
              >
                <Image src={p.src} alt={i < SHOWCASE.length ? p.alt : ""} width={360} height={360} sizes="220px" className="h-[78%] w-auto max-w-[82%] object-contain drop-shadow-[0_16px_18px_rgba(56,56,56,0.18)]" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <QualitySeals />

      {/* Precio miembro */}
      <section id="membresia" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(140deg,#2e2e2e,var(--navy)_60%)] p-7 text-white shadow-[0_24px_50px_rgba(56,56,56,0.28)] lg:p-9">
          <div className="pointer-events-none absolute -top-20 -right-20 size-[260px] rounded-full bg-[radial-gradient(circle,rgba(165,25,89,0.55),transparent_70%)]" />
          <span className="relative text-[11px] font-bold tracking-[0.1em] text-[#e6a9c5] uppercase">Precio miembro {BRAND.club}</span>
          <h3 className="relative mt-3 text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em] lg:text-[34px]">
            Los mismos productos, a precio de miembro
          </h3>
          <p className="relative mt-3 max-w-[440px] text-[14.5px] leading-[1.6] text-[#ecd0dc]">
            Cada producto tiene un precio público y un precio menor para los miembros del club. Al final de tu evaluación ves cuánto ahorrarías con tu kit.
          </p>
          <div className="relative mt-6 inline-flex max-w-[420px] flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <span className="text-[15px] text-[#d7bccb] line-through">${EXAMPLE_PUBLIC.toLocaleString("es-MX")}</span>
            <span className="text-[32px] leading-none font-extrabold">${EXAMPLE_MEMBER.toLocaleString("es-MX")}</span>
            <span className="rounded-full bg-[var(--green)] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] text-white">{EXAMPLE_PCT}% MENOS</span>
            <span className="basis-full text-[12px] leading-snug text-[#f4e5eb]">Ejemplo con un producto de la línea NutriDay Plus.</span>
          </div>
        </div>
      </section>

      <MemberTools distributor={distributor} />

      {/* Cierre */}
      <section className="mx-auto w-full max-w-[1180px] px-5 pt-16 pb-16 lg:px-8 lg:pt-24 lg:pb-24">
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--line)] bg-white px-6 py-12 text-center shadow-[0_24px_50px_rgba(56,56,56,0.08)] lg:py-16">
          <Ring360 animate={false} className="pointer-events-none absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] lg:size-[680px]" />
          <div className="relative">
            <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--blue)] uppercase">{BRAND.club}</span>
            <h2 className="mt-3 text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--navy)] lg:text-[46px]">Un gran estilo de vida comienza ahora</h2>
            <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-[1.6] text-[#4d4749]">Tres minutos, sin costo y con resultados al instante. Vívelo con WeNow.</p>
            <div className="mt-7 flex justify-center">
              <StartButton onClick={onStart}>Comenzar análisis gratis</StartButton>
            </div>
          </div>
        </div>
      </section>

      {assistantEnabled && <WinniePublic distributor={distributor} onStart={onStart} />}

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 py-10 md:grid-cols-[1fr_auto] md:items-start lg:px-8">
          <div>
            <Image src="/assets/wenow-360-logo.png" alt="WeNow 360" width={1259} height={1132} className="h-14 w-auto" />
            <p className="mt-4 max-w-[520px] text-[12px] leading-[1.6] text-[#8a8587]">
              WeNow 360 es una herramienta informativa de bienestar. No diagnostica, previene, trata ni cura enfermedades, y no sustituye la valoración de un profesional de la salud.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-[#4a4547]">
            <Link href="/aviso-de-privacidad" className="hover:text-[var(--navy)]">Aviso de privacidad</Link>
            <a href={`https://wa.me/${distributor.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--navy)]">WhatsApp</a>
          </nav>
          <p className="text-[12px] text-[#8a8587] md:col-span-2">© {new Date().getFullYear()} {BRAND.legalName}</p>
        </div>
      </footer>
    </div>
  );
}

function TrustList() {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-[22px] min-[340px]:grid-cols-2 border border-[var(--line)] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(56,56,56,0.06)] lg:grid-cols-4 lg:px-8">
      {["Evaluación personalizada", "Resultados inmediatos", "100% confidencial", "Totalmente gratuito"].map((t) => (
        <li key={t} className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--navy)] lg:justify-center lg:text-[14px]">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5f8ef] text-[#0d9a56]"><CheckIcon size={12} /></span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function StartButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="press group inline-flex max-w-full items-center justify-center gap-3 rounded-full text-left sm:whitespace-nowrap bg-[linear-gradient(120deg,var(--blue-bright),var(--blue)_45%,var(--navy))] py-2 pr-2 pl-7 text-[16px] font-bold text-white shadow-[0_18px_36px_rgba(165,25,89,0.32)]"
    >
      {children}
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--blue)] transition-transform duration-300 group-hover:translate-x-0.5">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  );
}

function AdvisorCard({ distributor }: { distributor: Distributor }) {
  return (
    <div className="flex max-w-[460px] flex-wrap items-center gap-3.5 rounded-[20px] border border-[var(--line)] bg-white/90 px-4 py-3.5 shadow-[0_14px_32px_rgba(56,56,56,0.07)] backdrop-blur">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--blue),var(--navy))] text-[14px] font-bold text-white ring-4 ring-[#f9e9f1]">
        {initials(distributor.displayName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--muted)] uppercase">Tu asesor WeNow</div>
        <div className="truncate text-[15px] font-semibold text-[var(--navy)]">{distributor.displayName}</div>
      </div>
      <a
        href={wa(distributor, `Hola ${distributor.displayName}, estoy por hacer mi WeNow 360.`)}
        target="_blank" rel="noopener noreferrer"
        className="press flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--whatsapp)] px-3.5 py-2 text-[12.5px] font-bold text-white max-[340px]:w-full"
      >
        <WhatsIcon /> WhatsApp
      </a>
    </div>
  );
}

// El anillo del logotipo enmarca tres empaques: de la mirada completa (360°) a los productos que la apoyan.
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px] animate-[sheet_800ms_ease-out_both] [animation-delay:120ms]">
      <Ring360 className="absolute inset-0 size-full" />
      <div className="absolute inset-[15%]">
        <span className="absolute inset-x-[8%] bottom-[6%] h-[9%] rounded-[50%] bg-[rgba(56,56,56,0.18)] blur-xl" />
        <Image src="/assets/products/neuro-chai.webp" alt="Neuro CHAI" width={420} height={420} priority sizes="(min-width:1024px) 220px, 40vw" className="absolute bottom-[6%] left-[-2%] w-[44%] -rotate-[8deg] drop-shadow-[0_18px_18px_rgba(56,56,56,0.25)]" />
        <Image src="/assets/products/antiox.webp" alt="AntiOX" width={420} height={420} priority sizes="(min-width:1024px) 220px, 40vw" className="absolute right-[-2%] bottom-[6%] w-[44%] rotate-[8deg] drop-shadow-[0_18px_18px_rgba(56,56,56,0.25)]" />
        <Image src="/assets/products/active-burn.webp" alt="Active Burn+" width={520} height={520} priority sizes="(min-width:1024px) 280px, 52vw" className="absolute bottom-[8%] left-1/2 w-[56%] -translate-x-1/2 drop-shadow-[0_22px_22px_rgba(56,56,56,0.28)]" />
      </div>
      <div className="absolute right-[2%] bottom-[3%] flex animate-[float_7s_ease-in-out_infinite] items-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_36px_rgba(56,56,56,0.16)] backdrop-blur-md [animation-delay:1.2s]">
        <div>
          <div className="text-[12.5px] font-bold text-[var(--navy)]">15 productos</div>
          <div className="text-[11px] text-[var(--muted)]">{BRAND.productLine}</div>
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-[var(--blue)] text-white"><CheckIcon size={13} /></span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-[640px]">
      <span className="text-[11.5px] font-bold tracking-[0.1em] text-[var(--blue)] uppercase">{eyebrow}</span>
      <h2 className="mt-3 text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-[var(--navy)] lg:text-[44px]">{title}</h2>
      {text && <p className="mt-3 text-[15px] leading-[1.6] text-[#4d4749]">{text}</p>}
    </div>
  );
}

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

const WhatsIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
  </svg>
);
