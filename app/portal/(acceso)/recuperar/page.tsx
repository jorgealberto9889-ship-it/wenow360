import { ResetRequestForm } from "../forms";

export default function Recuperar() {
  return (
    <>
      <h1 className="mt-3 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">¿Olvidaste tu contraseña?</h1>
      <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">Escribe tu correo y te enviamos un enlace para elegir una nueva.</p>
      <ResetRequestForm />
    </>
  );
}
