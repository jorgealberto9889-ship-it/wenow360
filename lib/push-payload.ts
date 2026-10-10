// Texto de cada notificación push (función pura para poder probarla). Nunca incluye datos de salud: solo el nombre
// de la persona y el enlace a su ficha en el portal.
export type PushMessage =
  | { kind: "nuevo_prospecto"; name: string; prospectId: string }
  | { kind: "prueba" };

export type PushPayload = { title: string; body: string; url: string; tag: string };

export function pushPayload(m: PushMessage): PushPayload {
  if (m.kind === "prueba") {
    return { title: "WeNow 360", body: "¡Listo! Así te avisaremos cuando llegue un prospecto nuevo.", url: "/portal", tag: "prueba" };
  }
  const first = m.name.trim().split(/\s+/)[0] || "Alguien";
  return {
    title: "Nuevo prospecto en WeNow 360",
    body: `${first} terminó su evaluación y quiere que le contactes.`,
    url: `/portal/prospecto/${m.prospectId}`,
    tag: `prospecto-${m.prospectId}`,
  };
}
