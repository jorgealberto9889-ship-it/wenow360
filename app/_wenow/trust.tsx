"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CERTIFICATIONS, QUALITY_INTRO, QUALITY_TITLE } from "@/lib/certifications";
import { Ring360 } from "./ring";
import { cx } from "./ui";

// Entra en pantalla una sola vez: sirve para disparar las animaciones al hacer scroll.
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

// Sección «Respaldo y calidad» de la portada: banda carbón con el anillo del logotipo y los sellos del
// laboratorio que entran uno a uno con un destello.
export function QualitySeals() {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <section ref={ref} id="calidad" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-5 pt-16 lg:px-8 lg:pt-24">
      <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(150deg,#2b2b2b,var(--navy)_70%)] px-6 py-12 text-white shadow-[0_28px_60px_rgba(56,56,56,0.3)] lg:px-12 lg:py-16">
        <div style={{ "--navy": "#6f6a6c" } as React.CSSProperties} className="pointer-events-none absolute -top-24 -right-24 size-[420px] opacity-[0.35] lg:size-[520px]">
          <Ring360 className="size-full" />
        </div>

        <div className="relative max-w-[640px]">
          <span className="text-[11.5px] font-bold tracking-[0.1em] text-[#e6a9c5] uppercase">Respaldo y calidad</span>
          <h2 className="mt-3 text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[42px]">{QUALITY_TITLE}</h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#d9d2d5]">{QUALITY_INTRO}</p>
        </div>

        <ul className="relative mt-10 flex flex-wrap justify-center gap-x-4 gap-y-8">
          {CERTIFICATIONS.map((c, i) => (
            <li
              key={c.id}
              style={{ transitionDelay: seen ? `${i * 110}ms` : "0ms" }}
              className={cx(
                "flex w-[calc(50%-8px)] flex-col items-center text-center sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                seen ? "translate-y-0 scale-100 opacity-100" : "translate-y-5 scale-90 opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100",
              )}
            >
              <span className="group relative flex size-[112px] items-center justify-center overflow-hidden rounded-full lg:size-[128px]">
                <Image src={c.image} alt={`Sello ${c.name}`} width={256} height={256} sizes="128px" className="h-[86%] w-[86%] object-contain" />
                {/* Destello único al aparecer */}
                {seen && (
                  <span
                    aria-hidden
                    style={{ animationDelay: `${600 + i * 110}ms` }}
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] opacity-0 motion-safe:animate-[sheen_1.1s_ease-out_both] motion-reduce:hidden"
                  />
                )}
              </span>
              <div className="mt-3 text-[14px] font-extrabold">{c.name}</div>
              <div className="mt-1 max-w-[170px] text-[12px] leading-snug text-[#d9d2d5]">{c.label}</div>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
}

// Versión compacta para el pie del resultado.
export function SealsRow() {
  return (
    <div className="rounded-[20px] bg-[var(--navy)] px-4 py-4 text-white">
      <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#e6a9c5] uppercase">Calidad de fabricación</div>
      <ul className="mt-3 flex items-center justify-between gap-2">
        {CERTIFICATIONS.map((c) => (
          <li key={c.id} className="flex flex-1 justify-center">
            <Image src={c.image} alt={`Sello ${c.name}`} width={96} height={96} className="size-[52px] object-contain" />
          </li>
        ))}
      </ul>
    </div>
  );
}
