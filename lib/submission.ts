import { z } from "zod";
import { answersSchema } from "./engine/answers";

// 2026-09-23: el asesor del enlace ve contacto y resumen de todos sus prospectos (portal del distribuidor).
// 2026-10-07: el escaneo con Shen.AI incluye variabilidad cardiaca, índice de estrés y actividad parasimpática.
// 2026-09-25: compra en la tienda WeNow; el recordatorio de 20 h ya no habla de una promoción que vence.
export const CONSENT_TEXT_VERSION = "2026-10-07";
export const CORPORATE_SLUG = "wenow";

const text = (max: number) => z.string().transform((s) => s.replace(/\s+/g, " ").trim()).pipe(z.string().max(max));

export const submissionSchema = z.object({
  distributorSlug: text(80).transform((s) => s.toLowerCase() || CORPORATE_SLUG),
  answers: answersSchema,
  contact: z.object({
    name: text(80).pipe(z.string().min(2)),
    email: text(120).transform((s) => s.toLowerCase()).pipe(z.string().email()),
    phone: text(30).refine((p) => {
      const digits = p.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15;
    }),
  }),
  consents: z.object({
    // Obligatorios del Bloque 0: sin ellos no hay evaluación.
    privacy: z.literal(true),
    sensitiveData: z.literal(true),
    advisorContact: z.boolean(),
    marketing: z.boolean(),
  }),
  scanToken: z.string().max(2000).optional(),
});

export type Submission = z.output<typeof submissionSchema>;
