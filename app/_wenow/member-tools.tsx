"use client";

import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { Ring360 } from "./ring";
import type { Distributor } from "./questions";
import { cx } from "./ui";
import { useInView } from "./trust";

// Solo herramientas que existen hoy en el sistema: enlace personal con atribución, escaneo facial rPPG,
// Winnie para los clientes y el portal de seguimiento de prospectos.
const TOOLS: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: `Tu enlace ${BRAND.name}`,
    text: "Una evaluación personalizada con tu nombre. La compartes por WhatsApp o redes y cada resultado queda ligado a ti.",
    icon: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  },
  {
    title: "Escaneo facial rPPG",
    text: "Cinco mediciones con la cámara (pulso, variabilidad, respiración, estrés y actividad parasimpática) en un panel clínico que tus clientes recuerdan.",
    icon: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M3 12h4l2-4 3 8 2-4h7" /></>,
  },
  {
    title: `${BRAND.assistantName}, asistente con IA`,
    text: "Resuelve dudas de tus clientes sobre productos, ingredientes y hábitos, a cualquier hora, para que tú te enfoques en acompañarlos.",
    icon: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" /></>,
  },
  {
    title: "Tu panel de seguimiento",
    text: "Cada prospecto con su resultado, los productos sugeridos y el estatus de su seguimiento, en un solo lugar y con notas.",
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 14h3M8 17h6" /></>,
  },
];

export function MemberTools({ distributor }: { distributor: Distributor }) {
  const [ref, seen] = useInView<HTMLElement>();
  const href = `https://wa.me/${distributor.whatsapp}?text=${encodeURIComponent(`Hola ${distributor.displayName}, me interesa ser miembro del ${BRAND.club} y conocer las herramientas ${BRAND.name}.`)}`;
  return (
    <section ref={ref} id="herramientas" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-8 lg:px-8 lg:pt-12">
      <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(150deg,#1d1d1d,#2e2e2e_55%,#3a1a2b)] px-6 py-12 text-white shadow-[0_28px_60px_rgba(56,56,56,0.32)] lg:px-12 lg:py-16">
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(199,31,112,0.4),transparent_65%)]" />
        <div style={{ "--navy": "#6f6a6c" } as React.CSSProperties} className="pointer-events-none absolute -top-28 -right-28 size-[440px] opacity-[0.3] lg:size-[540px]">
          <Ring360 className="size-full" />
        </div>

        <div className="relative max-w-[680px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-[#ffd3e8] uppercase">
            <span className="size-1.5 rounded-full bg-[#ff6fb0]" /> Para miembros del {BRAND.club}
          </span>
          <h2 className="mt-4 text-[32px] leading-[1.06] font-extrabold tracking-[-0.03em] lg:text-[46px]">
            Herramientas exclusivas para <span className="text-[#ff6fb0]">hacer crecer tu negocio</span>
          </h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-[#d9d2d5] lg:text-[16px]">
            Como miembro del {BRAND.club} tienes {BRAND.name}: tecnología propia para acompañar a tus clientes con una experiencia moderna y dar seguimiento a cada persona.
          </p>
        </div>

        <ul className="relative mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <li
              key={t.title}
              style={{ transitionDelay: seen ? `${i * 120}ms` : "0ms" }}
              className={cx(
                "rounded-[22px] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-sm transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                seen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--blue-bright),var(--blue))] text-white shadow-[0_10px_22px_rgba(165,25,89,0.4)]">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{t.icon}</svg>
              </span>
              <h3 className="mt-4 text-[16px] leading-snug font-bold">{t.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[#cfc8cb]">{t.text}</p>
            </li>
          ))}
        </ul>

        <div className="relative mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={href} target="_blank" rel="noopener noreferrer"
            className="press inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[14.5px] font-extrabold text-[var(--navy)] shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
          >
            Quiero ser miembro <span className="text-[var(--blue)]">→</span>
          </a>
          <span className="text-[12.5px] text-[#b1abae]">Tu asesor te explica cómo empezar.</span>
        </div>
      </div>
    </section>
  );
}
