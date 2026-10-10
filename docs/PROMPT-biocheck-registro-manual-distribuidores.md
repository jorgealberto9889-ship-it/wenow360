# Prompt para BioCheck (Bioteracel): registro manual de distribuidores con correo obligatorio y acceso automático

Copia lo que sigue y pégalo en la sesión de Claude Code de `biocheck-v2`.

---

En el panel de administración de BioCheck V2, cuando registro un distribuidor a mano (formulario «Agregar distribuidor», acción `saveDistributor` en `app/admin/(panel)/actions.ts`), hoy NO le llega ningún correo: el distribuidor queda activo, pero yo tengo que entrar a su ficha y presionar «Invitar» para que reciba el acceso a su portal. Quiero que:

1. **El correo sea obligatorio al registrar uno nuevo.** En la acción, si no hay `id` (alta) y `parsed.data.email` viene vacío, devolver `{ error: "El correo es obligatorio: ahí recibirá el acceso a su portal." }` antes de insertar. Al editar a un distribuidor existente NO se vuelve obligatorio (hay cuentas heredadas sin correo, como la corporativa).
2. **El correo de acceso salga siempre, en automático, al crear.** Después de insertar al distribuidor y hacer `revalidatePath`, enviar el mismo correo que ya usa `inviteDistributor` cuando el distribuidor no tiene contraseña: `sendLaunchEmail(email, { name, origin, distributorLink: `${origin}/d/${slug}`, activateUrl: `${origin}/portal/restablecer/${await signPasswordLink(id, null, LAUNCH_TTL)}` })` con `origin = await publicOrigin()`. Si sale bien, registrar `audit(admin.id, "portal_invited", "distributors", String(id))`.
3. **Si el envío falla, el distribuidor igual queda registrado**, pero la acción responde `{ ok: true, emailed: false }`. Amplía el tipo `FormState` con `emailed?: boolean`.
4. **Formulario** (`distributor-form.tsx`): el campo «Correo» con `required` cuando es alta, placeholder «Obligatorio» y una nota que explique que ahí le llega en automático el correo para crear su contraseña; el botón de alta dice «Agregar y enviar acceso». El `useEffect` que redirige a la lista solo debe hacerlo si `state.ok && state.emailed !== false`; si `emailed === false`, se queda en la pantalla y muestra un aviso ámbar: «Se registró, pero no se pudo enviar el correo de acceso. Entra a su ficha en Distribuidores y usa «Invitar» para reenviarlo.»

Adapta nombres de archivos y funciones a lo que realmente exista en BioCheck (puede variar respecto a WeNow 360). Al terminar:
- `npx tsc --noEmit`, `npx eslint app lib` y `npm test` sin errores.
- Prueba: registra un distribuidor de prueba con tu correo, comprueba que llega la invitación y que el botón permite crear la contraseña; luego desactívalo.
- Haz commit y push.
