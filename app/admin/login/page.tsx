import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso administrativo · WeNow 360",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-[380px] rounded-[22px] border border-[var(--line)] bg-white p-7 shadow-[0_16px_40px_rgba(56,56,56,0.08)]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--blue-bright)]" />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">
            WeNow 360 · Panel
          </span>
        </div>
        <h1 className="mt-3 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">
          Acceso administrativo
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-normal text-[var(--muted)]">
          Solo para el equipo de WeNow.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
