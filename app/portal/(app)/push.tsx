"use client";

import { useEffect, useState } from "react";
import { subscribePush, unsubscribePush } from "../actions";

// Tarjeta del portal para instalar la app y activar avisos push de prospectos nuevos.
type Status = "loading" | "unsupported" | "ios-install" | "off" | "on" | "denied";
type InstallPrompt = Event & { prompt: () => Promise<void> };

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushCard({ vapidKey }: { vapidKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [install, setInstall] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    // Chrome solo ofrece instalar si la app aún no está instalada.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // En iPhone las notificaciones solo existen con la app agregada a la pantalla de inicio.
        setStatus(ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/portal-sw.js", { scope: "/portal", updateViaCache: "none" });
        if (Notification.permission === "denied") return setStatus("denied");
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "on" : "off");
      } catch {
        setStatus("unsupported");
      }
    })();
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) }));
      const r = await subscribePush(JSON.parse(JSON.stringify(sub)), navigator.userAgent);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setStatus("on");
    } catch {
      setError("No pudimos activar las notificaciones en este navegador. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  const btn = "press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-bold";
  return (
    <section className="mb-3 rounded-[22px] bg-white p-5 ring-1 ring-[var(--line)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold tracking-[0.08em] text-[var(--blue)] uppercase">Avisos en tu celular</div>
        {status === "on" && <span className="rounded-full bg-[#e5f8ef] px-2.5 py-0.5 text-[11px] font-bold text-[#087748]">Activados</span>}
      </div>

      {status === "ios-install" && (
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--muted)]">
          Para recibir avisos en tu iPhone, primero agrega el portal a tu pantalla de inicio: toca <strong className="text-[var(--navy)]">Compartir</strong> y luego{" "}
          <strong className="text-[var(--navy)]">Agregar a pantalla de inicio</strong>. Ábrelo desde ese ícono y activa los avisos aquí.
        </p>
      )}
      {status === "off" && (
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--muted)]">Te avisamos al instante cuando alguien termine su WeNow 360 con tu enlace y pida que le contactes.</p>
      )}
      {status === "on" && (
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--muted)]">Recibirás un aviso en este dispositivo con cada prospecto nuevo.</p>
      )}
      {status === "denied" && (
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--muted)]">
          Las notificaciones están bloqueadas en este navegador. Permítelas en la configuración del sitio y vuelve a abrir el portal.
        </p>
      )}
      {error && <p className="mt-2 text-[12.5px] font-semibold text-[var(--red)]">{error}</p>}

      <div className="mt-3.5 flex gap-2.5 empty:hidden">
        {status === "off" && (
          <button type="button" disabled={busy} onClick={enable} className={`${btn} bg-[var(--blue)] text-white disabled:opacity-60`}>
            {busy ? "Activando…" : "Activar avisos"}
          </button>
        )}
        {status === "on" && (
          <button type="button" disabled={busy} onClick={disable} className={`${btn} bg-white text-[var(--navy)] ring-1 ring-[var(--line)] disabled:opacity-60`}>
            Desactivar avisos
          </button>
        )}
        {install && (
          <button
            type="button"
            onClick={async () => {
              await install.prompt();
              setInstall(null);
            }}
            className={`${btn} bg-[var(--navy)] text-white`}
          >
            Instalar app
          </button>
        )}
      </div>
    </section>
  );
}
