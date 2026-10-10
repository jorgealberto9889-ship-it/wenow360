import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { publicOrigin } from "@/lib/admin/origin";
import { requireAdmin } from "@/lib/dal";
import { PageHeader } from "../../ui";
import { DistributorForm } from "../distributor-form";
import { PortalAccess } from "../portal-access";
import { distributorStoreUrl } from "@/lib/store";
import { CopyButton } from "../../controls";

export default async function EditarDistribuidor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const [d] = Number.isInteger(id) ? await db.select().from(schema.distributors).where(eq(schema.distributors.id, id)) : [];
  if (!d) notFound();
  const origin = await publicOrigin();
  return (
    <>
      <Link href="/admin/distribuidores" className="text-[12.5px] font-semibold text-[var(--blue)]">← Distribuidores</Link>
      <div className="mt-3"><PageHeader title={d.displayName} subtitle={d.active ? "Activo" : `Inactivo${d.deactivatedReason ? ` · ${d.deactivatedReason}` : ""}`} /></div>
      <DistributorForm
        origin={origin}
        initial={{
          id: d.id, displayName: d.displayName, slug: d.slug, email: d.email ?? "", whatsapp: d.whatsapp,
          distributorId: d.distributorId ?? "", storeUrl: d.storeUrl ?? "",
        }}
      />
      <div className="mt-5 max-w-[720px] rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="text-[15px] font-bold text-[var(--navy)]">Enlace de la tienda</h2>
        <div className="mt-2"><CopyButton text={distributorStoreUrl(d.slug, d.storeUrl)}>{distributorStoreUrl(d.slug, d.storeUrl)}</CopyButton></div>
        <p className="mt-2 text-[12.5px] leading-snug text-[var(--muted)]">
          Comparte este enlace. Las compras quedan registradas a su nombre.
        </p>
      </div>
      <PortalAccess id={d.id} name={d.displayName} email={d.email} whatsapp={d.whatsapp} hasAccess={Boolean(d.portalPasswordHash)} origin={origin} />
    </>
  );
}
