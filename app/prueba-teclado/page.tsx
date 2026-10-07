import type { Metadata } from "next";
import { Variants } from "./variants";

export const metadata: Metadata = { title: "Prueba de teclado · WeNow 360", robots: { index: false, follow: false } };

// TEMPORAL: diagnóstico de la barra de autollenado de Chrome en iPhone. Borrar al terminar.
export default function PruebaTeclado() {
  return (
    <main className="mx-auto w-full max-w-[440px] px-5 py-8">
      <h1 className="text-[22px] font-extrabold text-[var(--navy)]">Prueba de teclado</h1>
      <p className="mt-2 text-[14px] leading-snug text-[#4a4547]">
        Toca cada campo, uno por uno. Anota en cuáles aparece arriba del teclado la barra con la llave, la tarjeta o la ubicación.
      </p>
      <Variants />
    </main>
  );
}
