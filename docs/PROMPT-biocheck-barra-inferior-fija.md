# Prompt para BioCheck (Bioteracel): barra inferior fija para que el botón responda en iPhone

Copia lo que sigue y pégalo en la sesión de Claude Code de `biocheck-v2`.

---

En BioCheck V2, en el resultado (las pantallas por actos con el botón de continuar abajo, por ejemplo «Ver lo que encontramos»), un lead reportó en iPhone que el botón se ve pero no responde al toque hasta llegar al final del scroll. La barra inferior usa `position: sticky; bottom: 0` dentro del componente `Screen` (`app/_biocheck/ui.tsx`). En iOS Safari, el hit-testing de los elementos `sticky` pegados al borde inferior puede fallar mientras la barra de direcciones se está colapsando. Ya lo corregimos en WeNow 360 pasando esa barra a `position: fixed`.

Haz esto:

1. Lee primero la implementación de referencia en `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/_wenow/ui.tsx` (componente `Screen`, prop `fixedFooter`) y su uso en `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/_wenow/result.tsx` (`<Screen fixedFooter footer={...}>`) y en `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/_wenow/clinical-panel.tsx` (barra fija propia).
2. En el `Screen` de BioCheck agrega la prop opcional `fixedFooter?: boolean`. Cuando es `true`: renderiza un espaciador `<div aria-hidden className="h-[104px] shrink-0" />` al final del contenido y la barra como `<div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)]"><div className="mx-auto w-full max-w-[440px] px-5 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))]">{footer}</div></div>`. Cuando es `false`, se queda igual que hoy. Respeta las variables de color y el ancho máximo de BioCheck.
3. Actívala (`fixedFooter`) solo en las pantallas del resultado donde se reportó el problema (los actos 1 y 2 y cualquier pantalla del resultado con botón de continuar abajo). No cambies el cuestionario ni otras pantallas si no lo piden.
4. Comprueba que el botón de continuar con animación de atención (anillos y destello) no tape ni quede tapado, y que el espaciador deja ver el último contenido.

Verificación: `npx tsc --noEmit`, `npx eslint app lib`, `npm test`. En el navegador con emulación móvil (375 px): abre un resultado, haz scroll a la mitad y toca el botón; debe avanzar al primer toque. Haz commit y push, y publica.
