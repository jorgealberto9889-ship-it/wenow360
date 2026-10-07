import { after } from "next/server";
import { submitAssessment } from "@/lib/assessments";
import { sendAssessmentEmails } from "@/lib/email";
import { scheduleFollowUps } from "@/lib/follow-ups";
import { appOrigin, signResultToken } from "@/lib/result-link";
import { submissionSchema } from "@/lib/submission";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    // Solo rutas de campo: nunca se devuelven los valores enviados (pueden ser datos de salud).
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))];
    return Response.json({ error: "Revisa tus respuestas.", fields }, { status: 422 });
  }

  try {
    const saved = await submitAssessment(parsed.data);
    const origin = appOrigin(request.url);
    // Se envía después de responder: la persona ve su resultado sin esperar al correo.
    after(async () => {
      await sendAssessmentEmails(saved.assessmentId, origin).catch((e) =>
        console.error("assessment_email_failed", { name: (e as Error)?.name }),
      );
      await scheduleFollowUps(saved.assessmentId, origin).catch((e) =>
        console.error("follow_up_schedule_failed", { name: (e as Error)?.name }),
      );
    });
    return Response.json({ ...saved, resultToken: await signResultToken(saved.assessmentId) }, { status: 201 });
  } catch (error) {
    // Los errores de la base incluyen los parámetros de la consulta (respuestas de salud):
    // nunca se registra el error completo, solo su tipo y código.
    const cause = (error as { cause?: { code?: string } })?.cause?.code;
    console.error("assessment_submit_failed", { name: (error as Error)?.name, code: cause ?? null });
    return Response.json({ error: "No pudimos guardar tu evaluación. Intenta de nuevo." }, { status: 500 });
  }
}
