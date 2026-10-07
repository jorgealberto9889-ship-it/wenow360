import Link from "next/link";
import { requireDistributor } from "@/lib/portal";
import { portalLogout } from "../../actions";
import { ChangePasswordForm } from "../client";

export default async function Cuenta() {
  const me = await requireDistributor();
  return (
    <>
      <Link href="/portal" className="text-[13px] font-semibold text-[var(--blue)]">← Mis prospectos</Link>
      <h1 className="mt-3 text-[20px] font-extrabold text-[var(--navy)]">Mi cuenta</h1>
      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[13px]">
          <dt className="text-[var(--muted)]">Nombre</dt><dd className="font-semibold text-[var(--navy)]">{me.displayName}</dd>
          <dt className="text-[var(--muted)]">Correo</dt><dd className="break-all text-[#4a4547]">{me.email}</dd>
          <dt className="text-[var(--muted)]">WhatsApp</dt><dd className="text-[#4a4547]">{me.whatsapp}</dd>
        </dl>
        <p className="mt-3 text-[11.5px] text-[var(--muted)]">Si algún dato no es correcto, pídele a WeNow que lo actualice.</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <h2 className="text-[14px] font-extrabold text-[var(--navy)]">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </section>
      <form action={portalLogout} className="mt-5">
        <button className="press w-full rounded-full bg-white py-3 text-[13.5px] font-bold text-[#9a1d17] ring-1 ring-[var(--line)]">Cerrar sesión</button>
      </form>
    </>
  );
}
