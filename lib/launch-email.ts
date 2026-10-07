import "server-only";
import { BRAND } from "./brand";
import { esc, sendViaResend } from "./email";

// Correo de bienvenida para distribuidores: activación del panel de WeNow 360.
// Diseño con tablas y estilos en línea para que se vea igual en Gmail, Outlook y iPhone.

export const LAUNCH_TTL = "7d";

type LaunchInput = { name: string; activateUrl: string; distributorLink: string; origin: string };

const NAVY = "#383838";
const BLUE = "#a51959";
const INK = "#4a4547";

const firstName = (name: string) => name.replace(/^(q\.?\s?b\.?|dr\.?|dra\.?|lic\.?|ing\.?)\s+/i, "").split(/\s+/)[0] ?? name;

const btn = (href: string, label: string, bg = BLUE, color = "#ffffff") =>
  `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:700;font-size:15px;padding:15px 28px;border-radius:999px">${esc(label)}</a>`;

const section = (inner: string, style = "background:#ffffff;border:1px solid #e6e0e3") =>
  `<tr><td style="padding:0 0 16px"><div style="${style};border-radius:20px;padding:24px">${inner}</div></td></tr>`;

const eyebrow = (t: string, color = BLUE) =>
  `<div style="font-size:11px;font-weight:800;letter-spacing:.1em;color:${color};text-transform:uppercase">${esc(t)}</div>`;

const item = (icon: string, title: string, detail: string) =>
  `<tr><td valign="top" style="padding:10px 12px 10px 0;width:36px"><div style="width:34px;height:34px;border-radius:10px;background:#fbeef4;text-align:center;line-height:34px;font-size:17px">${icon}</div></td>
<td valign="top" style="padding:10px 0;font-size:14px;line-height:1.5;color:${INK}"><strong style="color:${NAVY}">${esc(title)}</strong><br>${esc(detail)}</td></tr>`;

const PROSPECT_FEATURES: [string, string, string][] = [
  ["📷", "Escaneo facial en un minuto", "Con la cámara del celular leemos su pulso y su respiración, sin tocar nada. Opcional y sin guardar video."],
  ["🎧", "Un resultado que se escucha", "Su evaluación narrada con voz, en tres partes: lo que nos contó, lo que encontramos y su camino personalizado."],
  ["✨", `${BRAND.assistantName}, asistente con inteligencia artificial`, "Resuelve sus dudas sobre ingredientes, productos y precios en cualquier momento, y le invita a hablar contigo."],
  ["🎯", "Recomendaciones personalizadas", `Un kit con productos ${BRAND.productLine} elegido según sus objetivos, hábitos y seguridad.`],
  ["💰", "Precio miembro a la vista", `Ve cuánto ahorra con el precio de miembro del ${BRAND.club} y te tiene como su asesor.`],
  ["📬", "Correos que trabajan por ti", "Su resultado por correo y, si lo autoriza, un recordatorio de su kit al día siguiente y un seguimiento a los 7 días."],
];

const PANEL_FEATURES: [string, string, string][] = [
  ["👥", "Todos tus prospectos en un solo lugar", "Su resumen de bienestar, los productos sugeridos con precios y cómo contactarle."],
  ["📈", "Tu embudo en tiempo real", "Cuántas personas abren tu enlace, cuántas inician, cuántas terminan y quién te pidió que le acompañes."],
  ["💬", "WhatsApp con un toque", "Mensajes listos para escribirle a cada prospecto en el momento justo."],
  ["🗂️", "Seguimiento ordenado", "Marca a cada persona como Contactada, En seguimiento o Convertida, y guarda notas privadas."],
  ["🔔", "Aviso inmediato", "Cuando alguien pide que le acompañes, te llega un correo con su resumen completo."],
];

export function buildLaunchEmail({ name, activateUrl, distributorLink, origin }: LaunchInput) {
  const first = firstName(name);
  const shortLink = distributorLink.replace(/^https?:\/\//, "");
  const host = origin.replace(/^https?:\/\//, "");
  const subject = `${first}, activa tu panel de ${BRAND.name}`;
  const preheader = "Una experiencia para tus prospectos y un panel para acompañarlos mejor.";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f6f2f4;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#2b2b2b">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2f4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

<tr><td align="center" style="padding:4px 0 18px"><img src="${esc(origin)}/assets/email/logo.png" width="150" alt="${esc(BRAND.name)}" style="display:block;border:0;width:150px;height:auto"></td></tr>

<tr><td style="padding:0 0 16px"><div style="background:${NAVY};border-radius:24px;overflow:hidden">
<div style="padding:30px 26px 32px">
${eyebrow(`${BRAND.name} · ${BRAND.club}`, "#e6a9c5")}
<div style="font-size:27px;line-height:1.2;font-weight:800;color:#ffffff;margin-top:10px">${esc(first)}, tu panel de ${esc(BRAND.name)} está listo</div>
<p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:#ecd0dc">Cada persona que comparte su bienestar contigo merece una experiencia a la altura. Con ${esc(BRAND.name)} le ofreces una evaluación personalizada y tú recibes un panel propio para acompañar a cada prospecto y convertir cada evaluación en una conversación.</p>
<div style="margin-top:22px">${btn(activateUrl, "Activar mi panel", "#ffffff", NAVY)}</div>
<p style="margin:12px 0 0;font-size:12px;color:#e692b5">Toma un minuto: solo creas tu contraseña.</p>
</div></div></td></tr>

${section(`${eyebrow("Para tus prospectos")}
<div style="font-size:20px;font-weight:800;color:${NAVY};margin-top:6px">Una experiencia que se siente personal</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">${PROSPECT_FEATURES.map((f) => item(...f)).join("")}</table>`)}

${section(`${eyebrow("Para ti", "#d93025")}
<div style="font-size:20px;font-weight:800;color:${NAVY};margin-top:6px">Tu panel de distribuidor</div>
<p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${INK}">Desde tu celular, todo lo que necesitas para dar seguimiento a tus prospectos:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">${PANEL_FEATURES.map((f) => item(...f)).join("")}</table>
<div style="margin-top:18px">${btn(activateUrl, "Activar mi panel")}</div>`)}

${section(`${eyebrow("Actívalo en 1 minuto")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
${[
  ["1", "Toca «Activar mi panel» en este correo."],
  ["2", "Crea tu contraseña (mínimo 8 caracteres)."],
  ["3", `Listo. Entra cuando quieras desde ${host}/portal`],
]
  .map(([n, t]) => `<tr><td valign="top" style="padding:7px 12px 7px 0;width:30px"><div style="width:28px;height:28px;border-radius:999px;background:${BLUE};color:#ffffff;text-align:center;line-height:28px;font-weight:800;font-size:13px">${n}</div></td><td style="padding:7px 0;font-size:14px;line-height:1.5;color:${INK}">${esc(t!)}</td></tr>`)
  .join("")}
</table>`, "background:#fbeef4;border:1px solid #efc9da")}

${section(`${eyebrow("Tu enlace personal", "#087748")}
<div style="font-size:19px;font-weight:800;color:${NAVY};margin-top:6px">Pruébalo tú primero y compártelo</div>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${INK}">Este es tu enlace. Cada evaluación que se haga desde aquí queda registrada contigo como asesor:</p>
<div style="margin:12px 0 0;padding:12px 14px;border-radius:12px;background:#f6f2f4;font-family:Menlo,Consolas,monospace;font-size:13.5px;color:${BLUE};word-break:break-all">${esc(shortLink)}</div>
<div style="margin-top:16px">${btn(distributorLink, "Probar mi enlace", "#20c96b")}</div>`)}

<tr><td style="padding:6px 8px 0;font-size:14.5px;line-height:1.65;color:${INK}">
Gracias por ser parte del ${esc(BRAND.club)} y por llevar bienestar a más personas. Esta herramienta es para ti: úsala, compártela y cuéntanos cómo te va.<br><br>
Con cariño,<br><strong style="color:${NAVY}">El equipo de ${esc(BRAND.name)}</strong>
</td></tr>

<tr><td style="padding:22px 8px 0;font-size:11.5px;line-height:1.6;color:#8a8587">
El botón «Activar mi panel» es personal y vale por 7 días. Si vence, entra a ${esc(host)}/portal y toca «¿Olvidaste tu contraseña?» para recibir uno nuevo.<br>
${esc(BRAND.name)} es una herramienta informativa de bienestar: no diagnostica, previene, trata ni cura enfermedades.<br>
${esc(BRAND.disclaimer)}<br>
© ${new Date().getFullYear()} ${esc(BRAND.legalName)}
</td></tr>

</table></td></tr></table></body></html>`;

  const text = [
    `${first}, tu panel de ${BRAND.name} está listo.`,
    "",
    `Con ${BRAND.name} le ofreces a cada persona una evaluación personalizada y tú recibes un panel propio para acompañar a cada prospecto.`,
    "",
    `Activa tu panel (1 minuto): ${activateUrl}`,
    "",
    "PARA TUS PROSPECTOS",
    ...PROSPECT_FEATURES.map(([, t, d]) => `• ${t}: ${d}`),
    "",
    "PARA TI: TU PANEL DE DISTRIBUIDOR",
    ...PANEL_FEATURES.map(([, t, d]) => `• ${t}: ${d}`),
    "",
    `Tu enlace personal: ${distributorLink}`,
    "",
    `Gracias por ser parte del ${BRAND.club}.`,
    `El equipo de ${BRAND.name}`,
    "",
    `El enlace para activar tu panel vale por 7 días. Si vence, entra a ${origin}/portal y toca «¿Olvidaste tu contraseña?».`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendLaunchEmail(to: string, input: LaunchInput) {
  const { subject, html, text } = buildLaunchEmail(input);
  return sendViaResend({ to, subject, html, text, idempotencyKey: `lanzamiento-${input.activateUrl.slice(-24)}`, tag: "portal_launch" });
}
