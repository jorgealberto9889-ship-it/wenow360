"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { saveDistributor, type FormState } from "../actions";
import { fieldClass } from "../ui";

export type DistributorValues = {
  id?: number; displayName: string; slug: string; email: string; whatsapp: string; distributorId: string;
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function DistributorForm({ initial, origin }: { initial: DistributorValues; origin: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(saveDistributor, undefined);
  const [name, setName] = useState(initial.displayName);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const isNew = !initial.id;

  useEffect(() => {
    if (state?.ok) router.push("/admin/distribuidores");
  }, [state, router]);

  const field = (label: string, name: keyof DistributorValues, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold text-[var(--navy)]">{label}</span>
      <input name={name} defaultValue={String(initial[name] ?? "")} className={fieldClass} {...props} />
      {hint && <span className="text-[11.5px] text-[#8a8587]">{hint}</span>}
    </label>
  );

  return (
    <form action={action} className="mt-5 grid max-w-[720px] gap-4 rounded-2xl border border-[var(--line)] bg-white p-6 sm:grid-cols-2">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12.5px] font-bold text-[var(--navy)]">Nombre como lo verá el prospecto</span>
        <input
          name="displayName" required value={name} className={fieldClass}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12.5px] font-bold text-[var(--navy)]">Enlace personal</span>
        <div className="flex items-center overflow-hidden rounded-[10px] border border-[var(--line)] focus-within:border-[var(--blue)]">
          <span className="bg-[var(--bg)] px-3 py-2.5 font-mono text-[12px] text-[var(--muted)]">{origin.replace(/^https?:\/\//, "")}/d/</span>
          <input
            name="slug" required value={slug} className="min-w-0 flex-1 px-2 py-2.5 font-mono text-[13px] outline-none"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
        {!isNew && <span className="text-[11.5px] text-[#916000]">Si cambias el enlace, el anterior dejará de apuntar a este distribuidor.</span>}
      </label>
      {field("WhatsApp", "whatsapp", { required: true, inputMode: "tel", placeholder: "951 123 4567" }, "10 dígitos; agregamos la lada de México automáticamente.")}
      {field("Correo", "email", { type: "email", placeholder: "Opcional" }, "Recibe el aviso cuando un prospecto lo autoriza.")}
      {field("ID de distribuidor", "distributorId", { placeholder: "Opcional" }, "Su número de distribuidor WeNow.")}

      {state?.error && <p className="rounded-xl bg-[#fdeceb] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#9a1d17] sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2.5 sm:col-span-2">
        <button disabled={pending} className="press rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
          {pending ? "Guardando…" : isNew ? "Agregar distribuidor" : "Guardar cambios"}
        </button>
        <Link href="/admin/distribuidores" className="press rounded-[10px] border border-[var(--line)] px-5 py-2.5 text-[13px] font-bold text-[#4a4547]">Cancelar</Link>
      </div>
    </form>
  );
}
