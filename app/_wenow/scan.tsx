"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckIcon, cx, PrimaryButton, Screen, TextButton, TopBar } from "./ui";

export type ScanProvider = "shenai" | "vitallens";
// Duración de cada proveedor: Shen.AI usa su medición validada de un minuto.
const SCAN_SECONDS: Record<ScanProvider, number> = { vitallens: 45, shenai: 60 };
// Copias estáticas de las librerías (scripts/vendor-scan.mjs).
const VITALLENS_URL = "/vendor/vitallens/vitallens.browser.js";
const SHENAI_URL = "/vendor/shenai/index.mjs";
const SHENAI_CANVAS = "mxcanvas";
const MAX_WAIT_MS = 3 * 60 * 1000;

// Aviso que reemplaza la instrucción normal cuando algo impide medir (rostro fuera del óvalo, poca luz…).
type Hint = { title: string; detail: string };

type Status =
  | { kind: "intro" }
  | { kind: "scanning"; elapsed: number; hint: Hint | null }
  | { kind: "finishing" }
  | { kind: "done"; token: string; readings: Taken }
  | { kind: "failed"; message: string };

type Estimate = { value?: number; confidence?: number | number[] };
type VitalsEvent = { vitals?: { heart_rate?: Estimate; respiratory_rate?: Estimate }; face?: { confidence?: number[] } };

const lastConfidence = (c: Estimate["confidence"]) => (Array.isArray(c) ? (c.at(-1) ?? null) : (c ?? null));
const toReading = (e?: Estimate) => ({
  value: typeof e?.value === "number" && Number.isFinite(e.value) ? e.value : null,
  confidence: lastConfidence(e?.confidence),
});
type VitalLensInstance = {
  setVideoStream(stream?: MediaStream, video?: HTMLVideoElement): Promise<void>;
  startVideoStream(): void;
  stopVideoStream(): void;
  addEventListener(event: string, cb: (data: VitalsEvent) => void): void;
};

type Reading = {
  heartRateBpm: number | null; heartRateConfidence: number | null; respiratoryRateBpm: number | null; respiratoryRateConfidence: number | null;
  hrvSdnnMs?: number | null; hrvLnrmssdMs?: number | null; stressIndex?: number | null; parasympatheticActivity?: number | null; hrSeries?: number[] | null;
};
type Taken = { heart: boolean; respiratory: boolean; hrv?: boolean; stress?: boolean; parasympathetic?: boolean };

const FACE_HINT: Hint = { title: "Acomoda tu rostro dentro del óvalo", detail: "Busca luz de frente y acerca un poco el teléfono." };

const SAVE_TIMEOUT_MS = 20000;
const SAVE_FAILED = "No pudimos guardar tu lectura por un problema de conexión. Puedes intentarlo de nuevo o continuar sin este paso.";
const NO_CAMERA = "No pudimos acceder a tu cámara. Revisa el permiso de cámara de tu navegador, o continúa sin este paso.";
const UNAVAILABLE = "El escaneo no está disponible en este momento. Puedes continuar sin este paso.";
const UNCLEAR = "No logramos una lectura clara esta vez. Suele ayudar más luz de frente y mantenerte quiet@. Puedes intentarlo de nuevo o continuar sin este paso.";

// Lo mínimo que usamos de Shen.AI (la librería se carga como archivo estático y no se tipa desde el paquete).
type Enum = { value: number };
type ShenaiSdk = {
  initialize(apiKey: string, userId: string, settings: object, onResult: (r: Enum) => void): void;
  deinitialize(): void;
  attachToCanvas(selector: string): void;
  isReadyToStartMeasurement(): boolean;
  startMeasurement(): void;
  getMeasurementState(): Enum;
  getMeasurementProgressPercentage(): number;
  getRequiredModelsDownloadProgressPercentage?(): number;
  getHeartRateHistory10s?(maxTimeSec?: number): { hr_bpm: number }[];
  getMeasurementResults(): {
    heart_rate_bpm: number | null;
    breathing_rate_bpm: number | null;
    hrv_sdnn_ms: number | null;
    hrv_lnrmssd_ms: number | null;
    stress_index: number | null;
    parasympathetic_activity: number | null;
    average_signal_quality: number | null;
    quality_metrics: { ppg_quality_index: number | null; breathing_quality_index: number | null } | null;
  } | null;
  MeasurementPreset: Record<"ONE_MINUTE_HR_HRV_BR", Enum>;
  CameraMode: Record<"FACING_USER", Enum>;
  OnboardingMode: Record<"HIDDEN", Enum>;
  InitializationResult: Record<"OK", Enum>;
  MeasurementState: Record<"NOT_STARTED" | "FINISHED" | "FAILED", Enum>;
};

export function ScanStep({
  provider, onBack, onDone, onSkip,
}: { provider: ScanProvider; onBack: () => void; onDone: (scanToken: string) => void; onSkip: () => void }) {
  const seconds = SCAN_SECONDS[provider];
  const [status, setStatus] = useState<Status>({ kind: "intro" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => () => cleanupRef.current(), []);

  // Mientras Shen.AI se prepara (conexión, motor, modelos, cámara) se muestra un aviso con pasos y avance.
  const [loading, setLoading] = useState<{ step: number; pct: number | null } | null>(null);

  const stopAll = () => {
    setLoading(null);
    cleanupRef.current();
    cleanupRef.current = () => {};
  };

  const fail = (message: string) => {
    stopAll();
    setStatus({ kind: "failed", message });
  };

  const submit = async (sessionId: string, reading: Reading) => {
    setStatus({ kind: "finishing" });
    // Si la red se queda colgada, no dejamos la pantalla esperando para siempre.
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), SAVE_TIMEOUT_MS);
    const done = await fetch(`/api/scan/sessions/${sessionId}/finish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reading),
      signal: abort.signal,
    }).catch((e) => { console.error("scan_finish", e); return null; });
    clearTimeout(timeout);
    const body = (await done?.json().catch(() => null)) as { ok: boolean; scanToken?: string; readings?: Taken } | null;
    if (body?.ok && body.scanToken) setStatus({ kind: "done", token: body.scanToken, readings: body.readings ?? { heart: true, respiratory: false } });
    else fail(done && !done.ok && done.status !== 422 ? SAVE_FAILED : UNCLEAR);
  };

  const start = async () => {
    setStatus({ kind: "scanning", elapsed: 0, hint: FACE_HINT });
    if (provider === "shenai") setLoading({ step: 0, pct: null });
    const session = await fetch("/api/scan/sessions", { method: "POST" })
      .then((r) => (r.ok ? (r.json() as Promise<{ sessionId: string; provider: ScanProvider; token?: string }>) : null))
      .catch(() => null);
    if (!session) return fail(UNAVAILABLE);
    if (session.provider === "shenai" && session.token) return startShenai(session.sessionId, session.token);
    return startVitalLens(session.sessionId);
  };

  const startVitalLens = async (sessionId: string) => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
    } catch {
      return fail(NO_CAMERA);
    }
    const stopTracks = () => stream.getTracks().forEach((t) => t.stop());

    try {
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const { VitalLens } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ VITALLENS_URL)) as typeof import("vitallens");
      const vl = new VitalLens({ method: "vitallens", proxyUrl: `${window.location.origin}/api/vitallens/${sessionId}` }) as unknown as VitalLensInstance;
      // Última lectura calculada por la librería en el dispositivo; el servidor valida calidad y rangos.
      let latest = { heart: toReading(), respiratory: toReading() };
      vl.addEventListener("vitals", (data) => {
        const heart = toReading(data.vitals?.heart_rate);
        const respiratory = toReading(data.vitals?.respiratory_rate);
        latest = { heart: heart.value !== null ? heart : latest.heart, respiratory: respiratory.value !== null ? respiratory : latest.respiratory };
        const face = data.face?.confidence?.at(-1) ?? 0;
        setStatus((s) => (s.kind === "scanning" ? { ...s, hint: face >= 0.5 ? null : FACE_HINT } : s));
      });
      await vl.setVideoStream(stream, video);
      vl.startVideoStream();

      const began = Date.now();
      const tick = setInterval(() => {
        const elapsed = Math.min(seconds, (Date.now() - began) / 1000);
        setStatus((s) => (s.kind === "scanning" ? { ...s, elapsed } : s));
        if (elapsed >= seconds) void finish();
      }, 250);

      let finished = false;
      cleanupRef.current = () => {
        clearInterval(tick);
        try {
          vl.stopVideoStream();
        } catch {}
        stopTracks();
      };

      const finish = async () => {
        if (finished) return;
        finished = true;
        stopAll();
        await submit(sessionId, {
          heartRateBpm: latest.heart.value,
          heartRateConfidence: latest.heart.confidence,
          respiratoryRateBpm: latest.respiratory.value,
          respiratoryRateConfidence: latest.respiratory.confidence,
        });
      };
    } catch {
      stopTracks();
      fail(UNAVAILABLE);
    }
  };

  // Shen.AI mide en el dispositivo. Su plan actual obliga a mostrar su propia interfaz (guía de posición,
  // avisos de luz, progreso), así que ocupa la pantalla del escaneo en lugar de nuestro óvalo.
  // Solo usamos su pulso y su respiración.
  const startShenai = async (sessionId: string, token: string) => {
    let sdk: ShenaiSdk;
    try {
      const { default: CreateShenaiSDK } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ SHENAI_URL)) as { default: (args: object) => Promise<ShenaiSdk> };
      setLoading({ step: 1, pct: null });
      sdk = await CreateShenaiSDK({
        enableErrorReporting: false, enablePreloadDisplay: false,
        wasmLoadingProgressCallback: (p: number) => setLoading((l) => (l && l.step <= 1 ? { step: 1, pct: Math.round(Math.min(1, Math.max(0, p > 1 ? p / 100 : p)) * 100) } : l)),
      });
    } catch (e) {
      // Sin cámara o navegador incompatible (la librería lanza antes de iniciar).
      return fail(e instanceof DOMException || /camera|permission/i.test(String(e)) ? NO_CAMERA : UNAVAILABLE);
    }

    const timer: { id?: ReturnType<typeof setInterval> } = {};
    cleanupRef.current = () => {
      clearInterval(timer.id);
      try {
        sdk.deinitialize();
      } catch {}
    };

    const result = await new Promise<{ value: number }>((resolve) =>
      sdk.initialize(token, "", {
        measurementPreset: sdk.MeasurementPreset.ONE_MINUTE_HR_HRV_BR,
        cameraMode: sdk.CameraMode.FACING_USER,
        showUserInterface: true,
        showFacePositioningOverlay: true,
        showVisualWarnings: true,
        enableCameraSwap: false,
        showInfoButton: false,
        showDisclaimer: false,
        enableMeasurementsDashboard: false,
        onboardingMode: sdk.OnboardingMode.HIDDEN,
        enableSummaryScreen: false,
        enableHealthRisks: false,
        hideShenaiLogo: true,
        language: "es",
      }, resolve),
    );
    if (result.value !== sdk.InitializationResult.OK.value) return fail(UNAVAILABLE);
    sdk.attachToCanvas(`#${SHENAI_CANVAS}`);
    setLoading({ step: 2, pct: null });
    let modelsReadyAt = 0;

    const S = sdk.MeasurementState;
    const began = Date.now();
    let finished = false;
    timer.id = setInterval(() => {
      if (finished) return;
      // Avance de la preparación: modelos de lectura y, al terminar, la cámara; después se retira el aviso y
      // queda la guía propia de Shen.AI.
      const models = sdk.getRequiredModelsDownloadProgressPercentage?.() ?? 100;
      if (models < 100) setLoading((l) => (l ? { step: 2, pct: Math.round(models) } : l));
      else {
        modelsReadyAt ||= Date.now();
        setLoading((l) => (l && Date.now() - modelsReadyAt > 1500 ? null : l ? { step: 3, pct: null } : l));
      }
      const state = sdk.getMeasurementState().value;
      // La medición arranca cuando Shen.AI confirma rostro bien colocado y luz suficiente; mientras tanto se
      // muestran sus avisos. Si en 3 minutos no lo logra, se ofrece continuar sin el escaneo.
      if (state === S.NOT_STARTED.value) {
        if (sdk.isReadyToStartMeasurement()) sdk.startMeasurement();
        else if (Date.now() - began > MAX_WAIT_MS) {
          finished = true;
          return fail(UNCLEAR);
        }
      }
      if (state === S.FINISHED.value) {
        finished = true;
        try {
          const r = sdk.getMeasurementResults();
          let hrSeries: number[] | null = null;
          try {
            hrSeries = sdk.getHeartRateHistory10s?.(70)?.map((m) => m.hr_bpm).filter((n) => Number.isFinite(n)) ?? null;
          } catch {}
          stopAll();
          if (!r) return fail(UNCLEAR);
          const q = r.quality_metrics;
          void submit(sessionId, {
            heartRateBpm: r.heart_rate_bpm ?? null,
            heartRateConfidence: q?.ppg_quality_index ?? r.average_signal_quality ?? null,
            respiratoryRateBpm: r.breathing_rate_bpm ?? null,
            respiratoryRateConfidence: q?.breathing_quality_index ?? null,
            hrvSdnnMs: r.hrv_sdnn_ms ?? null,
            hrvLnrmssdMs: r.hrv_lnrmssd_ms ?? null,
            stressIndex: r.stress_index ?? null,
            parasympatheticActivity: r.parasympathetic_activity ?? null,
            hrSeries,
          });
        } catch (e) {
          // Cualquier error al leer el resultado: avisamos en lugar de dejar la pantalla congelada.
          console.error("scan_results", e);
          fail(UNCLEAR);
        }
        return;
      }
      if (state === S.FAILED.value) {
        finished = true;
        return fail(UNCLEAR);
      }
      const elapsed = (Math.min(100, Math.max(0, sdk.getMeasurementProgressPercentage())) / 100) * seconds;
      setStatus((s) => (s.kind === "scanning" ? { ...s, elapsed, hint: null } : s));
    }, 250);
  };

  if (status.kind === "done") {
    const { heart, respiratory, hrv, stress, parasympathetic } = status.readings;
    const parts = [heart && "tu pulso", hrv && "tu variabilidad cardiaca", respiratory && "tu respiración", stress && "tu índice de estrés", parasympathetic && "tu actividad parasimpática"].filter(Boolean) as string[];
    const read = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}` : (parts[0] ?? "tus mediciones");
    return (
      <Screen
        top={<TopBar progress={0.94} label="Opcional" />}
        footer={<PrimaryButton onClick={() => onDone(status.token)}>Continuar <ArrowRight /></PrimaryButton>}
      >
        <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-[#e5f8ef] text-[#087748] motion-safe:animate-[pop_420ms_cubic-bezier(0.23,1,0.32,1)]">
            <CheckIcon size={34} />
          </span>
          <h1 className="mt-5 text-[23px] font-extrabold tracking-[-0.015em] text-[var(--navy)]">¡Escaneo completado!</h1>
          <p className="mt-2.5 max-w-[300px] text-[14px] leading-[1.55] text-[#4a4547]">
            Leímos {read} con claridad y ya forma parte de tu evaluación. Verás tu panel de mediciones en tu resultado.
          </p>
          {!respiratory && (
            <p className="mt-3 max-w-[300px] text-[12.5px] leading-normal text-[var(--muted)]">
              Tu respiración no se leyó con suficiente claridad esta vez, así que no la usaremos.
            </p>
          )}
        </div>
      </Screen>
    );
  }

  const scanning = status.kind === "scanning" || status.kind === "finishing";
  const progress = status.kind === "scanning" ? status.elapsed / seconds : status.kind === "finishing" ? 1 : 0;

  return (
    <Screen
      top={<TopBar onBack={scanning ? undefined : onBack} progress={0.92} label="Opcional" />}
      footer={
        scanning ? (
          <button
            type="button"
            onClick={() => { stopAll(); onSkip(); }}
            className="press w-full rounded-full border-[1.5px] border-[var(--line)] py-3.5 text-[13.5px] font-bold text-[var(--muted)]"
          >
            Cancelar y omitir
          </button>
        ) : (
          status.kind === "failed" ? (
            <div className="flex flex-col gap-2.5">
              <PrimaryButton onClick={onSkip}>Continuar sin este paso</PrimaryButton>
              <button type="button" onClick={start} className="press w-full rounded-full border-[1.5px] border-[var(--line)] bg-white py-3.5 text-[14px] font-bold text-[var(--navy)]">
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <>
              <PrimaryButton onClick={start}>Escanear mi rostro ({seconds} segundos)</PrimaryButton>
              <TextButton onClick={onSkip}>Omitir este paso</TextButton>
            </>
          )
        )
      }
    >
      {scanning && provider === "shenai" ? (
        <ShenaiView finishing={status.kind === "finishing"} loading={loading} />
      ) : scanning ? (
        <ScanningView
          media={<video ref={videoRef} muted playsInline className="size-full -scale-x-100 object-cover" />}
          progress={progress}
          elapsed={status.kind === "scanning" ? status.elapsed : seconds}
          seconds={seconds}
          hint={status.kind === "scanning" ? status.hint : null}
          finishing={status.kind === "finishing"}
        />
      ) : (
        <div className="pt-2">
          <div className="flex size-[52px] items-center justify-center rounded-2xl bg-[#fbeef4]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="14" height="14" rx="3" stroke="#a51959" strokeWidth="1.7" />
              <circle cx="10" cy="12" r="3.2" stroke="#a51959" strokeWidth="1.7" />
              <path d="M17 9l4-2v10l-4-2" stroke="#a51959" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-3.5 text-[23px] leading-[1.28] font-extrabold tracking-[-0.015em] text-[var(--navy)]">
            Un dato opcional que puede hacer tu resultado más preciso
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#4a4547]">
            {provider === "shenai"
              ? `Con la cámara de tu teléfono medimos tu pulso, tu variabilidad cardiaca, tu respiración, tu índice de estrés y tu actividad parasimpática en ${seconds} segundos, sin tocar nada.`
              : `Con la cámara de tu teléfono podemos leer tu frecuencia cardiaca y tu frecuencia respiratoria en ${seconds} segundos, sin tocar nada.`}
          </p>
          {status.kind === "failed" && (
            <p role="alert" className="mt-4 rounded-xl bg-[#fff8ec] px-3.5 py-3 text-[12.5px] leading-normal text-[#5a4a2e]">{status.message}</p>
          )}
          <div className="mt-[18px] rounded-[18px] border border-[var(--line)] bg-white p-4">
            <div className="text-[12.5px] font-bold text-[var(--navy)]">¿Cómo funciona?</div>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[var(--muted)]">
              Esta tecnología se llama <strong className="text-[#4a4547]">fotopletismografía remota (rPPG)</strong>. Detecta cambios sutiles de color en tu piel causados por tu flujo sanguíneo — el mismo principio que usan los relojes inteligentes, pero leído con la cámara frontal de tu celular.
            </p>
            <p className="mt-2.5 text-[11px] leading-normal text-[#8a8587]">
              Referencia general: estudios de fotopletismografía remota (rPPG) publicados en PubMed reportan una precisión comparable a dispositivos vestibles en condiciones controladas de luz y quietud.
            </p>
          </div>
          {[
            "Es orientativo: no es un estudio clínico ni un diagnóstico.",
            "No guardamos tu video — solo el resultado de la lectura.",
          ].map((t) => (
            <div key={t} className="mt-3 flex items-start gap-2.5 text-[12.5px] leading-normal text-[#4a4547]">
              <span className="mt-0.5 text-[var(--green)]"><CheckIcon size={14} /></span>
              {t}
            </div>
          ))}
          <p className="mt-4 text-[11px] leading-normal text-[#8a8587]">
            Al tocar «Escanear», autorizas este uso de tu cámara para medir {provider === "shenai" ? "estos cinco datos" : "estos dos datos"}. {provider === "shenai"
              ? "El video se procesa en tu propio teléfono con la tecnología de Shen.AI, nuestro proveedor, y no se almacena."
              : "El video se procesa con VitalLens, nuestro proveedor, y no se almacena."}
          </p>
        </div>
      )}
    </Screen>
  );
}

// Pantalla de Shen.AI: su propia interfaz dibujada en un canvas, a todo lo ancho y sin empujar el botón fuera de
// la vista (≈240 px de barra superior, texto y botón).
const LOADING_STEPS = ["Conectando con Shen.AI", "Cargando el motor de medición", "Preparando los modelos de lectura", "Activando tu cámara"];

function ShenaiView({ finishing, loading }: { finishing: boolean; loading: { step: number; pct: number | null } | null }) {
  return (
    <div className="flex flex-col items-center pt-1">
      <p aria-live="polite" className="text-center text-[13px] leading-snug font-semibold text-[var(--navy)]">
        {finishing ? "¡Listo! Estamos preparando tu lectura…" : loading ? "Estamos preparando tu escaneo…" : "Sigue las indicaciones en pantalla y mantente quiet@ hasta terminar."}
      </p>
      <div className="relative mt-3 w-full overflow-hidden rounded-[22px] bg-[#2b2b2b]" style={{ height: "clamp(340px, calc(100dvh - 240px), 720px)" }}>
        <canvas id={SHENAI_CANVAS} className="block size-full" />
        {finishing && !loading && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1d1d1d]/95 px-6 text-center">
            <span className="relative flex size-14 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-white/10" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#ff6fb0] motion-safe:animate-[orbit_1s_linear_infinite]" />
            </span>
            <div className="text-[16px] font-bold text-white">Guardando tu lectura…</div>
            <p className="max-w-[250px] text-[12.5px] leading-[1.55] text-[#c9c2c5]">Medición completa. Estamos validando tus resultados; solo toma unos segundos.</p>
          </div>
        )}
        {loading && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#1d1d1d] px-6 text-center">
            <span className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-white/10" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#ff6fb0] motion-safe:animate-[orbit_1s_linear_infinite]" />
              <svg viewBox="0 0 24 24" className="size-6 text-[#ffd3e8]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
            </span>
            <div>
              <div className="text-[16px] font-bold text-white">Conectando con el analizador</div>
              <p className="mx-auto mt-1.5 max-w-[260px] text-[12.5px] leading-[1.55] text-[#c9c2c5]">Puede tardar unos segundos. No cierres esta pantalla: en cuanto esté listo te guiamos para colocar tu rostro.</p>
            </div>
            <ol className="flex w-full max-w-[280px] flex-col gap-2 text-left">
              {LOADING_STEPS.map((label, i) => {
                const done = i < loading.step;
                const active = i === loading.step;
                return (
                  <li key={label} className={cx("flex items-center gap-2.5 text-[12.5px]", done ? "text-[#ffd3e8]" : active ? "font-semibold text-white" : "text-[#7d7679]")}>
                    <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full border", done ? "border-[#ff6fb0] bg-[#ff6fb0]/20" : active ? "border-white/60" : "border-white/15")}>
                      {done ? <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : active ? <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" /> : null}
                    </span>
                    <span className="flex-1">{label}{active && loading.pct !== null ? ` · ${loading.pct}%` : "…"}</span>
                  </li>
                );
              })}
            </ol>
            <p className="max-w-[260px] text-[11.5px] leading-snug text-[#8f878b]">Consejo: busca buena luz de frente y sostén el teléfono a la altura de tu rostro.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Frases que acompañan cada tramo del escaneo (en fracción de la duración total).
const PHASES = [
  { until: 0.13, text: "Detectando tu rostro…" },
  { until: 0.31, text: "Analizando microcambios de color en tu piel…" },
  { until: 0.53, text: "Leyendo el ritmo de tu pulso…" },
  { until: 0.76, text: "Midiendo tu frecuencia respiratoria…" },
  { until: Infinity, text: "Afinando la precisión de tu lectura…" },
];
const STAGES = [
  { label: "Rostro", from: 0 },
  { label: "Pulso", from: 0.13 },
  { label: "Respiración", from: 0.53 },
];

// Óvalo: se dibuja desde arriba y en sentido horario para que la línea de progreso arranque en la frente.
const OVAL = "M50 2 A48 63 0 1 1 50 128 A48 63 0 1 1 50 2";

function ScanningView({
  media, progress, elapsed, seconds, hint, finishing,
}: { media: React.ReactNode; progress: number; elapsed: number; seconds: number; hint: Hint | null; finishing: boolean }) {
  const phase = finishing ? "Preparando tu lectura…" : PHASES.find((p) => progress < p.until)!.text;
  const needsFace = !finishing && hint !== null;
  const faceFound = !needsFace;
  const remaining = Math.ceil(seconds - elapsed);

  return (
    <div className="flex flex-col items-center pt-1">
      <div
        aria-live="polite"
        className={cx(
          "flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors duration-300",
          needsFace ? "bg-[#fff4df] text-[#7a4f00]" : "bg-[var(--navy)] text-white shadow-[0_12px_28px_rgba(56,56,56,0.25)]",
        )}
      >
        <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-full", needsFace ? "bg-[#ffe3ad]" : "bg-white/15")}>
          {needsFace ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" /><circle cx="12" cy="12" r="3.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M3 12h4l2-5 4 10 2-5h6" />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[15px] leading-tight font-extrabold">
            {finishing ? "¡Listo! Ya puedes moverte" : hint ? hint.title : "Mantente quiet@ y respira con normalidad"}
          </div>
          <div className={cx("mt-0.5 text-[12px] leading-snug", needsFace ? "text-[#8a6412]" : "text-[#d7bccb]")}>
            {finishing ? "Estamos preparando tu lectura." : hint ? hint.detail : "No hables ni muevas la cabeza hasta terminar."}
          </div>
        </div>
      </div>

      <div className="relative mt-3"
        // Todo el ancho disponible (menos el margen de la pantalla) sin empujar el botón fuera de la vista
        // (≈280 px de lo demás: barra superior, instrucción, etapas y botón).
        style={{ width: "clamp(220px, min(calc(100vw - 24px), calc((100dvh - 280px) / 1.3)), 440px)", aspectRatio: "100 / 130" }}>
        <div className={cx("absolute -inset-3 rounded-[50%] bg-[radial-gradient(closest-side,rgba(165,25,89,0.28),transparent)]", !finishing && "motion-safe:animate-[halo-soft_2.4s_ease-in-out_infinite]")} aria-hidden />
        <div className="absolute inset-[2%] overflow-hidden rounded-[50%] bg-[#2b2b2b]">
          {media}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:14px_14px] opacity-40" aria-hidden />
          {!finishing && (
            <div className="pointer-events-none absolute inset-x-0 h-[18%] motion-safe:animate-[scanline_2.8s_ease-in-out_infinite] motion-reduce:hidden" aria-hidden>
              <div className="h-full bg-[linear-gradient(180deg,transparent,rgba(165,25,89,0.35))]" />
              <div className="h-[2px] bg-[#e48ab0] shadow-[0_0_12px_2px_rgba(111,168,255,0.9)]" />
            </div>
          )}
        </div>
        <svg viewBox="0 0 100 130" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <path d={OVAL} fill="none" stroke="#f2e0e8" strokeWidth="2.2" />
          <path
            d={OVAL} fill="none" stroke={needsFace ? "#f0a92b" : "var(--blue-bright)"} strokeWidth="2.6" strokeLinecap="round"
            pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - progress)}
            className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
          />
          {[
            "M14 22 L14 14 L22 14", "M86 22 L86 14 L78 14", "M14 108 L14 116 L22 116", "M86 108 L86 116 L78 116",
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke={needsFace ? "#f0a92b" : "#e6a9c5"} strokeWidth="1.6" strokeLinecap="round" />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-x-[14%] bottom-[7%] flex flex-col items-center gap-1 text-center" aria-live="polite">
          <span className="rounded-full bg-[rgba(56,56,56,0.78)] px-3 py-1.5 text-[12.5px] leading-tight font-semibold text-white backdrop-blur">{phase}</span>
          <span className="rounded-full bg-[rgba(56,56,56,0.6)] px-2.5 py-0.5 text-[11px] font-bold text-[#f1dde5] tabular-nums backdrop-blur" role="timer">
            {finishing ? "Casi listo…" : `${remaining} s · ${Math.round(progress * 100)}%`}
          </span>
        </div>
        {!finishing && (
          <span className="absolute top-[7%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[rgba(56,56,56,0.72)] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em] text-white uppercase backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#ff6a5e] motion-safe:animate-pulse" /> Analizando
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {STAGES.map((st, i) => {
          const next = STAGES[i + 1]?.from ?? 1;
          const done = finishing || progress >= next;
          const active = !done && progress >= st.from && (i > 0 || faceFound || progress > 0);
          return (
            <span
              key={st.label}
              className={cx(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors duration-300",
                done ? "bg-[#e5f8ef] text-[#087748]" : active ? "bg-[#f9e9f1] text-[var(--blue)]" : "bg-[#f8f0f3] text-[#de709e]",
              )}
            >
              {done ? <CheckIcon size={10} /> : <span className={cx("size-1.5 rounded-full bg-current", active && "motion-safe:animate-pulse")} />}
              {st.label}
            </span>
          );
        })}
      </div>

    </div>
  );
}
