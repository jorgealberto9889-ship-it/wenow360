# WeNow 360

Evaluación personalizada de bienestar de **Club WeNow** (productos NutriDay Plus). Next 16 · React 19 · Tailwind 4 · Turso/Drizzle.
Base: BioCheck V2 de Órbita Digital, adaptada a WeNow.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Marca, textos legales y datos pendientes | `lib/brand.ts` |
| Catálogo (15 productos, ingredientes, beneficios, precios MX) | `scripts/data/wenow-catalog.ts` |
| Motor de recomendación (pesos, exclusiones, pares incompatibles) | `lib/engine/engine.ts` + `engine.test.ts` |
| Objetivos y respuestas del cuestionario | `lib/engine/answers.ts`, `app/_wenow/questions.ts` |
| Portada, cuestionario y resultado | `app/_wenow/` |
| Anillo 360° (elemento gráfico del logotipo) | `app/_wenow/ring.tsx` |
| Colores y tipografía (Montserrat) | `app/globals.css`, `app/layout.tsx` |
| Precio público / precio miembro | `lib/labels.ts` (`distributorPrice` = precio miembro) |
| Prompt del asistente de IA | `lib/assistant.ts` |
| Recorte de empaques (fondo blanco → transparente) | `scripts/cutout-products.py` |

## Arrancar en local

```bash
npm install
cp .env.example .env.local     # TURSO_DATABASE_URL=file:local.db y SESSION_SECRET (openssl rand -base64 32)
npm run db:migrate && npm run db:seed
npm run dev
npm test
```

## Pendiente de WeNow (ver `lib/brand.ts`)

Razón social y domicilio, correo de privacidad, WhatsApp y correo corporativos, plataforma de compra, imagen o personaje de Winnie (hoy es una esfera de marca), reglas del Club, precios de Colombia y Perú, y el producto BLOOM (sin datos todavía).
