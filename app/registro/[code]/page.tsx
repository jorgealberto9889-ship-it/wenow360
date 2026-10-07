import type { Metadata } from "next";
import Image from "next/image";
import { isValidRegistrationCode } from "@/lib/registration";
import { RegistrationForm } from "./form";

export const metadata: Metadata = {
  title: "Registro de miembros · WeNow 360",
  robots: { index: false, follow: false },
};

export default async function Registro({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const valid = await isValidRegistrationCode(code);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10">
      <Image src="/assets/wenow-logo.png" alt="WeNow" width={976} height={224} className="mb-6 h-7 w-auto" />
      <div className="w-full max-w-[420px] rounded-[22px] border border-[var(--line)] bg-white p-7 shadow-[0_16px_40px_rgba(56,56,56,0.08)]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--red)]" />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">WeNow 360 · Registro de miembros</span>
        </div>
        {valid ? (
          <>
            <h1 className="mt-3 text-[23px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">Solicita tu enlace de WeNow 360</h1>
            <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">
              Con tu enlace, tus prospectos hacen su evaluación de bienestar y tú recibes sus resultados para darles seguimiento. WeNow revisa cada solicitud antes de activarla.
            </p>
            <RegistrationForm code={code} />
          </>
        ) : (
          <>
            <h1 className="mt-3 text-[23px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">Enlace no válido</h1>
            <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">Este enlace de registro no es válido. Pídele a WeNow el enlace correcto.</p>
          </>
        )}
      </div>
    </main>
  );
}
