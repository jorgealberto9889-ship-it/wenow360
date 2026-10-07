import Link from "next/link";
import { publicOrigin } from "@/lib/admin/origin";
import { requireAdmin } from "@/lib/dal";
import { PageHeader } from "../../ui";
import { DistributorForm } from "../distributor-form";

export default async function NuevoDistribuidor() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/distribuidores" className="text-[12.5px] font-semibold text-[var(--blue)]">← Distribuidores</Link>
      <div className="mt-3"><PageHeader title="Agregar distribuidor" subtitle="Tendrá su propio enlace de WeNow 360 y recibirá a sus prospectos." /></div>
      <DistributorForm
        origin={await publicOrigin()}
        initial={{ displayName: "", slug: "", email: "", whatsapp: "", distributorId: "" }}
      />
    </>
  );
}
