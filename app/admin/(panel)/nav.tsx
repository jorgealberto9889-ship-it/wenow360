"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  resumen: <><rect x="3" y="12" width="5" height="8" rx="1" /><rect x="10" y="7" width="5" height="13" rx="1" /><rect x="17" y="3" width="5" height="17" rx="1" /></>,
  prospectos: <path d="M4 4h16v13H8l-4 4V4Z" strokeLinejoin="round" />,
  distribuidores: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c1-3.5 3.5-5 5.5-5s4.5 1.5 5.5 5" strokeLinecap="round" /><circle cx="17" cy="8" r="2.6" /><path d="M15.5 12c2.3 0 4.4 1.4 5.3 4.6" strokeLinecap="round" /></>,
  catalogo: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  dueno: <><path d="M4 19V9l4 3 4-6 4 5 4-3v11Z" strokeLinejoin="round" /></>,
  operacion: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" strokeLinecap="round" /></>,
};

const ITEMS = [
  { href: "/admin", label: "Resumen", icon: ICONS.resumen },
  { href: "/admin/prospectos", label: "Prospectos", icon: ICONS.prospectos },
  { href: "/admin/distribuidores", label: "Distribuidores", icon: ICONS.distribuidores },
  { href: "/admin/catalogo", label: "Catálogo", icon: ICONS.catalogo },
  { href: "/admin/operacion", label: "Operación", icon: ICONS.operacion },
];

export function AdminNav({ owner }: { owner?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:mt-7 lg:flex-col lg:gap-[3px] lg:overflow-visible">
      {(owner ? [...ITEMS, { href: "/admin/dueno", label: "Dueño · Consumo", icon: ICONS.dueno }] : ITEMS).map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`press flex shrink-0 items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              active ? "bg-white/10 text-white" : "text-[#eeb5cd] hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
