import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Portal del distribuidor · WeNow 360",
  robots: { index: false, follow: false },
};

export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10">
      <Image src="/assets/wenow-logo.png" alt="WeNow" width={976} height={224} className="mb-6 h-7 w-auto" />
      <div className="w-full max-w-[400px] rounded-[22px] border border-[var(--line)] bg-white p-7 shadow-[0_16px_40px_rgba(56,56,56,0.08)]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--red)]" />
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">WeNow 360 · Portal del distribuidor</span>
        </div>
        {children}
      </div>
    </main>
  );
}
