import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { SCAN_PROVIDER_LABEL, scanProvider } from "@/lib/scan-provider";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | WeNow 360",
  description: "Aviso de privacidad integral de WeNow 360, operado por WeNow",
};

// Base redactada según lo que la plataforma hace hoy. PENDIENTE antes de publicar: razón social, domicilio y
// correo de privacidad de WeNow (lib/brand.ts) y revisión por su asesor legal.
const PENDING = "[pendiente de WeNow]";
export default function PrivacyNotice() {
  const provider = scanProvider() ?? "vitallens";
  const scanLabel = SCAN_PROVIDER_LABEL[provider];
  const privacyEmail = BRAND.privacyEmail || PENDING;
  const mailto = BRAND.privacyEmail ? `mailto:${BRAND.privacyEmail}` : undefined;
  return (
    <main className="min-h-dvh bg-[var(--bg)]">
      <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <span className="text-[14px] font-extrabold text-[var(--navy)]">WeNow 360 <span className="font-medium text-[var(--muted)]">· Club WeNow</span></span>
        <Link href="/" className="text-[13px] font-semibold text-[var(--blue)]">Volver</Link>
      </header>
      <article className="prose-privacy mx-auto w-full max-w-[720px] px-5 pt-6 pb-16">
        <p className="text-[12px] font-bold tracking-[0.06em] text-[var(--blue)] uppercase">Última actualización: 2 de octubre de 2026</p>
        <h1>Aviso de Privacidad Integral</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#4a4547]">
          Este aviso explica cómo WeNow trata los datos personales que recaba a través de WeNow 360.
        </p>
        <div className="mt-5 rounded-2xl border border-[#efc9da] bg-[#fbeef4] p-4 text-[14px] leading-relaxed text-[#4a4547]">
          <strong>Alcance.</strong> WeNow 360 es una herramienta informativa de bienestar. No diagnostica, previene, trata ni cura enfermedades, y no sustituye la valoración de un profesional de la salud.
        </div>

        <section>
          <h2>1. Responsable</h2>
          <p>
            <strong>{BRAND.legalName}</strong>, con domicilio en {BRAND.legalAddress || PENDING}.
          </p>
          <p>Contacto de privacidad: {mailto ? <a href={mailto}>{privacyEmail}</a> : privacyEmail}.</p>
        </section>

        <section>
          <h2>2. Datos personales que recabamos</h2>
          <ul>
            <li><strong>Identificación y contacto:</strong> nombre, correo electrónico y número de WhatsApp.</li>
            <li><strong>Atribución:</strong> el enlace o código del miembro por el que llegaste a WeNow 360.</li>
            <li>
              <strong>Datos de bienestar:</strong> edad, sexo biológico, embarazo o lactancia, estatura y peso (opcionales), objetivos de bienestar, la frecuencia con la que notas ciertas molestias (por ejemplo, cansancio, tensión, dificultad para dormir o molestias digestivas), hábitos de sueño, hidratación, alimentación, actividad física, tabaco y alcohol, sensibilidad a la cafeína, dificultad para tragar cápsulas, alergias o restricciones alimentarias, medicamentos de uso regular, condiciones de salud diagnosticadas y los detalles adicionales que decidas escribir.
            </li>
            <li>
              <strong>Lectura biométrica (opcional):</strong> si eliges hacer el escaneo facial, estimamos tu frecuencia cardiaca y tu frecuencia respiratoria a partir del video de tu rostro, mediante fotopletismografía remota (rPPG). El video se procesa en tiempo real{provider === "shenai" ? " dentro de tu propio dispositivo" : ""} y <strong>no se almacena</strong>; solo conservamos los valores resultantes.
            </li>
            <li><strong>Conversaciones con Winnie (opcional):</strong> las preguntas que le hagas a Winnie, nuestro asistente virtual, y sus respuestas. Si usas el micrófono, el dictado lo realiza tu propio navegador y a nosotros solo nos llega el texto.</li>
            <li><strong>Conversaciones con Winnie en la página de inicio (opcional):</strong> los mensajes que le escribas a Winnie antes de tu evaluación se envían a nuestro proveedor de inteligencia artificial solo para generar la respuesta y <strong>no se guardan en nuestros servidores</strong>. Winnie no sabe quién eres; te pedimos no escribir datos personales. Para limitar abusos guardamos un contador diario asociado a una huella cifrada de tu conexión, nunca tu dirección IP ni tus mensajes.</li>
            <li><strong>Datos técnicos:</strong> fecha y hora de tus consentimientos, registros de envío de correos y la información mínima necesaria para la seguridad de la plataforma.</li>
          </ul>
          <p>
            Los datos de bienestar, la lectura biométrica, los medicamentos y las condiciones de salud son <strong>datos personales sensibles</strong>. Los tratamos únicamente con tu consentimiento expreso, que otorgas al marcar la autorización antes de comenzar la evaluación y, en el caso del escaneo, al iniciarlo voluntariamente.
          </p>
        </section>

        <section>
          <h2>3. Finalidades primarias</h2>
          <p>Son necesarias para darte el servicio que solicitas:</p>
          <ul>
            <li>Generar tu evaluación de bienestar y aplicar reglas de seguridad y exclusión, por ejemplo, no sugerir productos durante el embarazo o si existe una condición que lo desaconseje.</li>
            <li>Mostrarte tu resultado en pantalla y, si lo eliges, narrártelo en voz alta.</li>
            <li>Responder las preguntas que le hagas a Winnie, nuestro asistente virtual, por texto o en voz alta. Winnie conoce tus áreas de bienestar y los productos que te sugerimos, pero no tus respuestas de salud.</li>
            <li>Enviarte tu resultado por correo electrónico, con un enlace seguro para volver a consultarlo durante 90 días.</li>
            <li>Mostrarte los precios públicos y los precios de miembro del Club WeNow, y tu ahorro estimado.</li>
            <li>Si decides comprar, llevarte a la tienda en línea de WeNow o a la conversación de WhatsApp con tu asesor. A la tienda solo le enviamos el identificador de tu asesor; nunca tus respuestas ni tus datos de salud.</li>
            <li>Atribuir tu evaluación al miembro cuyo enlace usaste y dirigirte a su WhatsApp cuando decidas contactarlo.</li>
            <li>Poner tu contacto y el resumen de tu resultado a disposición del asesor cuyo enlace usaste, para que pueda acompañarte, y avisarle de inmediato cuando autorices que te contacte (ver sección 6).</li>
            <li>Conservar tus respuestas y el resultado generado para respaldar y verificar la evaluación que recibiste.</li>
            <li>Registrar tus consentimientos, mantener la seguridad de la plataforma y cumplir obligaciones legales.</li>
          </ul>
        </section>

        <section>
          <h2>4. Finalidades secundarias</h2>
          <p>Solo con tu autorización, que otorgas activando la opción «Recordatorios y tips de bienestar»:</p>
          <ul>
            <li>Enviarte un recordatorio de tu kit sugerido al día siguiente de tu evaluación.</li>
            <li>Enviarte un correo de seguimiento sobre tus hábitos y consejos ocasionales de bienestar.</li>
          </ul>
          <p>
            También podremos analizar el uso de WeNow 360 de forma agregada o disociada, sin identificarte. Puedes negarte a estas finalidades o revocarlas en cualquier momento con el enlace «Darme de baja» incluido en cada correo o escribiendo a {mailto ? <a href={mailto}>{privacyEmail}</a> : privacyEmail}. Negarte no afecta tu evaluación ni tu resultado.
          </p>
        </section>

        <section>
          <h2>5. Análisis automatizado</h2>
          <p>
            WeNow 360 genera tu resultado con reglas previamente definidas a partir de tus respuestas. La lectura biométrica, si la haces, solo matiza el área de manejo de tensión. En perfiles específicos, WeNow 360 no sugiere productos y te recomienda consultar a un profesional. El resultado es orientativo: no produce efectos jurídicos ni constituye un diagnóstico o tratamiento. Puedes pedir la intervención de una persona escribiendo a nuestro contacto de privacidad.
          </p>
        </section>

        <section>
          <h2>6. Con quién compartimos tus datos</h2>
          <p>
            <strong>Tu asesor o miembro del Club.</strong> El miembro cuyo enlace usaste puede consultar en su portal tu nombre, teléfono, correo, tus áreas prioritarias, los productos sugeridos y el estatus de su seguimiento, para poder acompañarte. Solo te escribirá si lo autorizas al final de la evaluación; si no lo autorizas, en su portal verá que no pediste contacto. Nunca recibe tus condiciones de salud, medicamentos, respuestas detalladas, tu lectura biométrica ni tus conversaciones con Winnie.
          </p>
          <p>
            <strong>Proveedores que nos ayudan a operar WeNow 360</strong>, que tratan los datos por nuestra cuenta, solo para prestarnos su servicio y bajo obligaciones de confidencialidad: alojamiento y base de datos (Vercel y Turso), envío de correos (Resend), procesamiento del escaneo facial ({scanLabel}), conversión de texto a voz (Google Cloud) y generación de respuestas de Winnie (Google Gemini, en su modalidad de pago, que no usa tus conversaciones para entrenar sus modelos). Algunos de estos proveedores se encuentran fuera de México.
          </p>
          <p>También podremos comunicar información a autoridades cuando exista una obligación legal. <strong>WeNow no vende tus datos personales.</strong></p>
        </section>

        <section>
          <h2>7. Conservación y seguridad</h2>
          <p>
            Conservamos tus datos y respuestas hasta por 12 meses a partir de tu evaluación, o hasta que revoques tu consentimiento si ocurre antes, salvo que la ley nos obligue a conservarlos por más tiempo. Después los eliminamos o los disociamos para que ya no te identifiquen. El video del escaneo facial nunca se almacena.
          </p>
          <p>
            Aplicamos medidas administrativas, técnicas y físicas razonables, incluyendo acceso restringido por roles, cifrado en tránsito, enlaces firmados con vencimiento y registro de auditoría de los accesos administrativos.
          </p>
        </section>

        <section>
          <h2>8. Derechos ARCO y revocación del consentimiento</h2>
          <p>
            Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, revocar tu consentimiento o limitar su uso y divulgación, enviando un correo a {mailto ? <a href={mailto}>{privacyEmail}</a> : privacyEmail} con el asunto <strong>«Derechos ARCO WeNow 360»</strong>.
          </p>
          <p>
            Incluye tu nombre, un medio para responderte, el derecho que deseas ejercer, la descripción de los datos y los documentos que acrediten tu identidad o, en su caso, la representación. Te comunicaremos nuestra respuesta en un máximo de 20 días hábiles y, si procede, la haremos efectiva dentro de los 15 días hábiles siguientes, salvo las ampliaciones que permita la ley.
          </p>
        </section>

        <section>
          <h2>9. Cookies y tecnologías similares</h2>
          <p>
            WeNow 360 utiliza únicamente las tecnologías necesarias para operar, conservar la atribución del miembro y proteger la plataforma. Para medir el desempeño de cada enlace contamos de forma anónima las visitas y los inicios del cuestionario, con una marca temporal en tu navegador que se borra al cerrar la pestaña. No usamos cookies de publicidad ni de analítica de terceros. Si en el futuro las incorporamos, actualizaremos este aviso y solicitaremos tu consentimiento.
          </p>
        </section>

        <section>
          <h2>10. Menores de edad y cambios a este aviso</h2>
          <p>
            WeNow 360 está dirigido exclusivamente a personas de 18 años o más; si indicas una edad menor, la evaluación no continúa. Los cambios a este aviso se publicarán en esta misma página con su fecha de actualización.
          </p>
        </section>
      </article>
    </main>
  );
}
