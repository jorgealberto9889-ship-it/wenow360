"use client";

import { useActionState } from "react";
import { login } from "./actions";

const field =
  "mt-1.5 w-full rounded-[12px] border border-[var(--line)] bg-white px-3.5 py-3 text-[14px] text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--blue)] focus:shadow-[0_0_0_3px_rgba(165,25,89,0.12)]";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="text-[12.5px] font-semibold text-[var(--navy)]">
        Correo
        <input name="email" type="email" autoComplete="username" required className={field} />
      </label>
      <label className="text-[12.5px] font-semibold text-[var(--navy)]">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-[10px] bg-[#fdeceb] px-3 py-2 text-[12.5px] font-medium text-[#9a1d17]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="press mt-1 rounded-full bg-[var(--blue)] py-3.5 text-[14.5px] font-bold text-white shadow-[0_14px_30px_rgba(165,25,89,0.26)] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
