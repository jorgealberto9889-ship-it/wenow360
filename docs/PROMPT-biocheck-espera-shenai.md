# Prompt para BioCheck (Bioteracel): aviso de espera al abrir el analizador Shen.AI

Copia todo lo que sigue y pégalo en la sesión de Claude Code de `biocheck-v2`.

---

En BioCheck V2, cuando el lead toca «Escanear» con Shen.AI como proveedor, la pantalla se queda en blanco unos 10 segundos mientras se cargan la conexión, el motor WASM y los modelos de lectura. El lead cree que se trabó y se sale. Quiero un aviso de carga con pasos y avance, y además proteger el final del escaneo para que nunca se quede congelado. Ya lo hicimos en WeNow 360 y funcionó bien; aplícalo igual, con la paleta de BioCheck (no copies los colores magenta: usa los azules de BioCheck).

Archivo a modificar: `app/_biocheck/scan.tsx` (o el equivalente donde esté `startShenai` y la vista del canvas de Shen.AI). Antes de editar, léelo completo y respeta su estilo.

## 1. Aviso de carga mientras Shen.AI se prepara

Estado nuevo en el componente del escaneo (colócalo junto a los demás `useState`, antes de cualquier `return` temprano):

```tsx
const [loading, setLoading] = useState<{ step: number; pct: number | null } | null>(null);
```

- En `stopAll()` agrega, al inicio, `setLoading(null);` (así `fail()` y el final también lo limpian).
- En `start()`, justo después de `setStatus({ kind: "scanning", ... })`: `if (provider === "shenai") setLoading({ step: 0, pct: null });`
- En `startShenai`, antes de `CreateShenaiSDK`: `setLoading({ step: 1, pct: null });` y pasa el callback de progreso del WASM:

```tsx
sdk = await CreateShenaiSDK({
  enableErrorReporting: false, enablePreloadDisplay: false,
  wasmLoadingProgressCallback: (p: number) =>
    setLoading((l) => (l && l.step <= 1 ? { step: 1, pct: Math.round(Math.min(1, Math.max(0, p > 1 ? p / 100 : p)) * 100) } : l)),
});
```

- Tras `sdk.attachToCanvas(...)`: `setLoading({ step: 2, pct: null }); let modelsReadyAt = 0;`
- Agrega al tipo del SDK: `getRequiredModelsDownloadProgressPercentage?(): number;`
- Dentro del `setInterval` que ya existe (después de `if (finished) return;` y antes de leer `getMeasurementState()`), agrega:

```tsx
// Avance de la preparación: modelos de lectura y, al terminar, la cámara; después se retira el aviso
// y queda la guía propia de Shen.AI.
const models = sdk.getRequiredModelsDownloadProgressPercentage?.() ?? 100;
if (models < 100) setLoading((l) => (l ? { step: 2, pct: Math.round(models) } : l));
else {
  modelsReadyAt ||= Date.now();
  setLoading((l) => (l && Date.now() - modelsReadyAt > 1500 ? null : l ? { step: 3, pct: null } : l));
}
```

- Pasa `loading` a la vista del canvas de Shen.AI: `<ShenaiView finishing={...} loading={loading} />`, y reemplaza esa vista por:

```tsx
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
```

Adapta clases y colores a BioCheck (el spinner y los pasos activos en el azul de marca; fondo oscuro del recuadro igual que el canvas).

## 2. Que el final del escaneo nunca se quede congelado

En WeNow el servidor respondía bien, pero conviene blindar el cliente:

- Envuelve en `try/catch` toda la rama `state === S.FINISHED.value` del `setInterval` (lectura de `getMeasurementResults()`, `stopAll()` y `submit(...)`). En el `catch`: `console.error("scan_results", e); fail(UNCLEAR);` Hoy, si algo lanza una excepción ahí después de `finished = true`, la pantalla se queda congelada sin mensaje.
- En `submit`, usa un `AbortController` con tiempo límite de 20 s en el `fetch` a `/api/scan/sessions/[id]/finish`, y limpia el temporizador al responder. Si no responde o falla por red (no 422), llama `fail("No pudimos guardar tu lectura por un problema de conexión. Puedes intentarlo de nuevo o continuar sin este paso.")`.
- Mientras `status.kind === "finishing"` muestra sobre el canvas (que queda congelado tras `deinitialize()`) un aviso «Guardando tu lectura…» con spinner, para que se vea que sigue trabajando.

## 3. Verificación

- `npx tsc --noEmit`, `npx eslint app lib` y `npm test` sin errores.
- Prueba real con un celular y la clave de Shen.AI: al tocar «Escanear» el aviso debe aparecer de inmediato, los pasos se marcan, y a los pocos segundos queda la guía de Shen.AI. Al terminar, debe verse «Guardando tu lectura…» y luego la pantalla de escaneo completado.
- Si el SDK no expone `getRequiredModelsDownloadProgressPercentage`, el aviso se quita solo 1.5 s después de adjuntar el canvas; no debe romper nada.
- Haz commit y push, y publica en Vercel.

Opcional (segunda mejora): precargar el motor WASM en segundo plano mientras la persona contesta el cuestionario, para que al llegar al escaneo la espera casi desaparezca.
