import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { initials } from "@/lib/admin/format";
import { logout } from "../login/actions";
import { AdminNav } from "./nav";
import { PaymentBanner } from "./payment-banner";

export const metadata: Metadata = {
  title: "Panel · WeNow 360",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const name = admin.email.split("@")[0]!;
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)] lg:flex-row">
      <aside className="shrink-0 bg-[var(--navy)] px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:flex-col lg:py-[22px]">
        <div className="flex items-center justify-between gap-3 pb-3 lg:block lg:pb-0">
          <div className="rounded-xl bg-white px-3 py-2.5">
            <Image src="/assets/wenow-logo.png" alt="WeNow" width={976} height={224} priority className="h-6 w-auto" />
          </div>
          <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#c58aa5] uppercase lg:mt-2.5 lg:px-1">WeNow 360 · Panel admin</div>
        </div>
        <AdminNav owner={admin.role === "super_admin"} />
        <div className="mt-auto hidden items-center gap-2.5 border-t border-white/10 px-2 pt-4 lg:flex">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-[11px] font-bold text-white">
            {initials(name.replace(/[._\d]+/g, " "))}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-white">{admin.email}</div>
            <div className="text-[10.5px] text-[#c58aa5]">{admin.role === "super_admin" ? "Super admin" : "Equipo"}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 px-2 pt-3">
          <Link href="/admin/cuenta" className="press text-[12px] font-semibold text-[#c58aa5] hover:text-white">Mi cuenta</Link>
          <form action={logout}><button className="press text-[12px] font-semibold text-[#c58aa5] hover:text-white">Cerrar sesión</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
        <PaymentBanner />
        {children}
      </main>
    </div>
  );
}
