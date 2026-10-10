# Prompt para BioCheck (Bioteracel): pantalla privada «Dueño · Consumo y margen» y medición de consumo

Copia lo que sigue y pégalo en la sesión de Claude Code de `biocheck-v2`.

---

Soy el dueño del desarrollo (Órbita Digital) y le cobro una cuota mensual a Bioteracel. Quiero controlar el costo real de operar BioCheck V2 y mi margen, y que el equipo del cliente NO vea esa información. En WeNow 360 ya lo construimos; porta lo que aplique a BioCheck.

**Antes de empezar, lee la implementación de referencia en WeNow 360** (misma máquina):
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/usage-costs.ts` y `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/usage-costs.test.ts` (cálculo puro de costos, márgenes, presupuesto de IA y cuota de equilibrio; es portable casi tal cual).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/usage.ts` (`recordUsage`, `loadSettings`/`saveSettings`, `monthReport`).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/db/schema.ts`: tablas `usageEvents` y `ownerSettings`, y su migración `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/drizzle/0013_consumo_dueno.sql`.
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/assistant.ts` (`askGemini` registra `usageMetadata`: tokens de entrada y salida, incluidos los de razonamiento) y `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/tts.ts` (`synthesize` registra caracteres).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/dal.ts` (`requireOwner`: solo el rol `super_admin`), `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/dueno/page.tsx` y `actions.ts`, y el ítem «Dueño · Consumo» de `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/nav.tsx` visible solo para el dueño.
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/operacion/page.tsx`: «Servicios incluidos en tu plan» (función de cada servicio, SIN nombres de proveedores, claves, cupos ni costos) y el bloque «Tu plan este mes».

**Qué hacer en BioCheck:**
1. Migración con `usage_events` y `owner_settings` (ver el SQL de referencia).
2. Instrumentar cada llamada a Gemini y a la voz con `recordUsage` (sin bloquear nunca la respuesta al usuario; si falla, se ignora). Escaneos y correos se cuentan desde sus tablas existentes (`scan_sessions`, `email_events`).
3. Pantalla `/admin/dueno` solo para el dueño, con costos fijos, consumo variable, ingreso (con IVA) y margen sobre el neto, cupos del plan, presupuesto de IA y proyección al cierre de mes, y el formulario para capturar tarifas y cuota.
4. **Los números de BioCheck son distintos a los de WeNow: no copies los valores por omisión.** Pregúntame antes de fijar: precio mensual del plan con IVA, cupos incluidos (escaneos, correos, referencia de respuestas de Winnie/CelIA), y quién paga cada servicio (en WeNow, Shen.AI lo paga el cliente, Vercel es un plan compartido de Órbita y dominio+hosting es un cobro anual que pasa directo al cliente). Deja esos datos editables en el formulario.
5. En Operación, sustituye el listado de servicios con nombres de proveedor por la versión sin proveedores.
6. Arregla también el script de pruebas: `"test": "tsx --test \"lib/**/*.test.ts\""` (con comillas, para que corra todas las pruebas y no solo las de un nivel).

**Rol del dueño:** el equipo del cliente debe crearse con rol `staff`; la pantalla del dueño exige `super_admin`. Confirma cómo están los roles hoy y ajusta el comando de crear administrador si hace falta.

Verificación: `npx tsc --noEmit`, `npx eslint app lib`, `npm test`; migra con `npm run db:migrate` (revisa antes a qué base apunta tu `.env.local`). Entra como dueño, confirma que aparece «Dueño · Consumo» y que un usuario `staff` no la ve ni puede abrir la ruta. Haz commit y push, y publica.
