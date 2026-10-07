import Link from "next/link";
import { verifyPasswordLink } from "@/lib/portal";
import { NewPasswordForm } from "../../forms";

export default async function Restablecer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await verifyPasswordLink(token);
  if (!link) {
    return (
      <>
        <h1 className="mt-3 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">Este enlace ya no es válido</h1>
        <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">Pudo haber vencido o ya se usó. Pide uno nuevo y te llegará a tu correo.</p>
        <Link href="/portal/recuperar" className="press mt-6 block rounded-full bg-[var(--blue)] py-3.5 text-center text-[15px] font-bold text-white">Pedir un enlace nuevo</Link>
      </>
    );
  }
  const first = link.displayName.split(/\s+/)[0];
  return (
    <>
      <h1 className="mt-3 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">
        {link.isNew ? `¡Bienvenid@, ${first}!` : "Elige tu nueva contraseña"}
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">
        {link.isNew ? "Crea tu contraseña para entrar a tu portal de WeNow 360." : `Hola ${first}, escribe tu nueva contraseña.`}
      </p>
      <NewPasswordForm token={token} isNew={link.isNew} />
    </>
  );
}
