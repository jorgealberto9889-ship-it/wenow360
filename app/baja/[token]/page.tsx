import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unsubscribe, verifyUnsubscribeToken } from "@/lib/follow-ups";

export const metadata: Metadata = {
  title: "Darme de baja · WeNow 360",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// La baja se confirma con un botón (POST): los filtros de correo abren enlaces automáticamente
// y no deben poder dar de baja a nadie por accidente.
export default async function Unsubscribe({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ listo?: string }> }) {
  const { token } = await params;
  const { listo } = await searchParams;
  const valid = (await verifyUnsubscribeToken(token)) !== null;

  async function confirm() {
    "use server";
    const id = await verifyUnsubscribeToken(token);
    if (id) await unsubscribe(id);
    redirect(`/baja/${token}?listo=1`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5">
      {!valid ? (
        <>
          <h1 className="text-[23px] font-extrabold text-[var(--navy)]">Enlace no válido</h1>
          <p className="mt-2 text-[14px] leading-normal text-[var(--muted)]">Si quieres dejar de recibir correos, escríbenos al correo de privacidad de WeNow.</p>
        </>
      ) : listo ? (
        <>
          <h1 className="text-[23px] font-extrabold text-[var(--navy)]">Listo, ya no te enviaremos recordatorios</h1>
          <p className="mt-2 text-[14px] leading-normal text-[var(--muted)]">Cancelamos los correos que teníamos programados para ti. Tu resultado sigue disponible con el enlace de tu primer correo.</p>
        </>
      ) : (
        <form action={confirm}>
          <h1 className="text-[23px] font-extrabold text-[var(--navy)]">¿Dejar de recibir recordatorios?</h1>
          <p className="mt-2 text-[14px] leading-normal text-[var(--muted)]">Ya no te enviaremos recordatorios ni tips de bienestar.</p>
          <button type="submit" className="press mt-6 w-full rounded-full bg-[var(--blue)] py-4 text-[15px] font-bold text-white">
            Confirmar baja
          </button>
        </form>
      )}
    </main>
  );
}
