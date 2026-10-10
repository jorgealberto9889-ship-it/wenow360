import { requireAdmin } from "@/lib/dal";
import { PageHeader, Panel } from "../ui";
import { PasswordForm } from "./password-form";

export default async function Cuenta() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader title="Mi cuenta" subtitle={`${admin.email} · ${admin.role === "super_admin" ? "Dueño" : "Equipo"}`} />
      <Panel className="mt-6 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Cambiar contraseña</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">Si te entregaron una contraseña temporal, cámbiala aquí en tu primer acceso.</p>
        <PasswordForm />
      </Panel>
    </>
  );
}
