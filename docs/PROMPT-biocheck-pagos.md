# Prompt para BioCheck (Bioteracel): sección «Pagos» para el administrador y avisos de cobro

Copia lo que sigue y pégalo en la sesión de Claude Code de `biocheck-v2`.

---

Cobro a Bioteracel una cuota mensual por BioCheck V2. Quiero una sección «Pagos» en su panel de administración, un recordatorio en pantalla antes de la fecha límite y un aviso de «pago vencido» que NUNCA detenga el servicio. En WeNow 360 ya lo construimos; porta lo que aplique.

**Antes de empezar, lee la implementación de referencia en WeNow 360:**
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/billing-status.ts` y `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/billing-status.test.ts` (función pura `nextCharge`: estados sin cobro, pendiente, vencido y al corriente; el día límite se acota a 1-28).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/db/schema.ts`: tabla `payments` y `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/drizzle/0014_pagos.sql`; `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/billing.ts` (`listPayments`).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/pagos/page.tsx` (plan con desglose de IVA, próximo pago con botón «Pagar ahora», renovación anual de dominio y hosting, historial, y la línea «¿Necesitas factura? Solicítala a Órbita Digital…»).
- `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/payment-banner.tsx` y su uso en `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/layout.tsx` (franja ámbar de recordatorio N días antes y franja roja de pago vencido).
- En `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/app/admin/(panel)/dueno/`: el panel «Pagos del cliente» (registrar y quitar pagos a mano, `recordPayment` y `deletePayment`, solo el dueño) y los campos de configuración: primer mes con cobro, día límite, días de recordatorio y enlace de pago (solo https). Ahí también se usa `/Users/jorgealbertorivera/Desktop/PROYECTO WENOW/DESARROLLO/wenow360/lib/usage-costs.ts` (`OwnerSettings.billing` y `annual`).

**Reglas de negocio ya acordadas en WeNow (confírmalas para Bioteracel antes de fijarlas):**
- El servicio nunca se detiene por falta de pago; solo se muestran avisos hasta que el dueño registre el pago.
- Sin datos fiscales en el sistema: si piden factura, se emite de forma manual y, opcionalmente, se pega su enlace al registrar el pago.
- El dominio y hosting se cobra una vez al año (primer año gratis, luego renovación fija) como recordatorio; puede pasar directo al cliente y no contar como ingreso del dueño.
- El enlace de pago es de Mercado Pago (hoy fijo). El registro automático con webhook, creando un cobro por mes con `external_reference`, es una fase posterior.

**Pregúntame antes de fijar:** precio mensual con IVA, primer mes con cobro, día límite, días de recordatorio, enlace de pago y si hay cobro anual.

Verificación: `npx tsc --noEmit`, `npx eslint app lib`, `npm test`; migra con `npm run db:migrate` (revisa a qué base apunta tu `.env.local`). Para ver los avisos, cambia temporalmente el primer mes y el día límite en la pantalla del dueño (recordatorio y vencido) y restáuralos. Haz commit y push, y publica.
