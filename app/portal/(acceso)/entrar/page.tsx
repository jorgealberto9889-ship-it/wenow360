import { LoginForm } from "../forms";

export default function Entrar() {
  return (
    <>
      <h1 className="mt-3 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">Entra a tu portal</h1>
      <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">Da seguimiento a las personas que hacen su WeNow 360 con tu enlace.</p>
      <LoginForm />
    </>
  );
}
