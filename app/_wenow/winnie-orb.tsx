import { cx } from "./ui";

// Evento para abrir el chat de Winnie desde cualquier parte de la pantalla.
export const OPEN_WINNIE_EVENT = "winnie:open";

// Burbuja de Winnie: esfera con el degradado de la marca, brillo y un destello.
export function WinnieOrb({ size = 56, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <span
      className={cx("relative inline-flex shrink-0 items-center justify-center rounded-full", animated && "motion-safe:animate-[float_3.2s_ease-in-out_infinite]")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {animated && <span className="absolute inset-0 rounded-full bg-[var(--blue-bright)] opacity-30 motion-safe:animate-[halo_2.6s_ease-out_infinite]" />}
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,rgba(255,255,255,0)_32%),linear-gradient(140deg,var(--navy)_0%,var(--blue)_55%,var(--blue-bright)_100%)] shadow-[0_10px_24px_rgba(165,25,89,0.35),inset_0_-6px_12px_rgba(56,56,56,0.25)]" />
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none" className="relative text-white">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="currentColor" />
        <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" fill="currentColor" opacity=".8" />
      </svg>
    </span>
  );
}

