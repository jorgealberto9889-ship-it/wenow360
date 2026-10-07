import type { Metadata } from "next";
import Link from "next/link";
import { initials } from "@/lib/admin/format";
import { requireDistributor } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Mi portal · WeNow 360",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const me = await requireDistributor();
  const first = me.displayName.replace(/^(q\.?\s?b\.?|dr\.?|dra\.?|lic\.?|ing\.?)\s+/i, "").split(/\s+/)[0];
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[560px] bg-[var(--bg)] px-4 pt-5 pb-12">
      <header className="flex items-center justify-between gap-3">
        <Link href="/portal" className="min-w-0">
          <div className="text-[22px] leading-tight font-extrabold tracking-[-0.015em] text-[var(--navy)]">Hola, {first}</div>
          <div className="text-[12.5px] text-[var(--muted)]">Tu portal de WeNow 360</div>
        </Link>
        <Link href="/portal/cuenta" aria-label="Mi cuenta" className="press flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[12px] font-bold text-white">
          {initials(me.displayName)}
        </Link>
      </header>
      <main className="mt-5">{children}</main>
    </div>
  );
}
