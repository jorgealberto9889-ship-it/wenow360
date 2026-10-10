import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const now = (name: string) =>
  text(name)
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const bool = (name: string) => integer(name, { mode: "boolean" });
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// 1. Identidad y acceso

export const adminUsers = sqliteTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super_admin", "staff"] }).notNull().default("staff"),
  active: bool("active").notNull().default(true),
  createdAt: now("created_at"),
  lastLoginAt: text("last_login_at"),
});

// Mismas columnas e IDs enteros que la tabla productiva, para no romper enlaces /d/[slug].
export const distributors = sqliteTable("distributors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  distributorId: text("distributor_id").unique(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp").notNull(),
  storeUrl: text("store_url").notNull(),
  registrationUrl: text("registration_url"),
  active: bool("active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  portalPasswordHash: text("portal_password_hash"),
  deactivatedReason: text("deactivated_reason"),
});

// Solicitudes de alta que llegan por el enlace de registro (/registro/<código>). WeNow las revisa en el
// panel: al aprobarlas se crea el distribuidor y se le envía el correo para activar su portal.
export const distributorApplications = sqliteTable(
  "distributor_applications",
  {
    id: id(),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp").notNull(),
    distributorNumber: text("distributor_number").notNull(),
    status: text("status", { enum: ["pendiente", "aprobada", "rechazada"] }).notNull().default("pendiente"),
    createdAt: now("created_at"),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    distributorRef: integer("distributor_ref"),
  },
  (t) => [index("distributor_applications_status_idx").on(t.status)],
);

// 2. Prospectos y evaluaciones

export const prospects = sqliteTable(
  "prospects",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    distributorSlug: text("distributor_slug").notNull(),
    createdAt: now("created_at"),
  },
  (t) => [
    index("prospects_distributor_slug_idx").on(t.distributorSlug),
    index("prospects_email_idx").on(t.email),
  ],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: id(),
    prospectId: text("prospect_id").references(() => prospects.id),
    distributorSlug: text("distributor_slug").notNull(),
    questionnaireVersion: text("questionnaire_version").notNull(),
    status: text("status", { enum: ["in_progress", "completed", "abandoned"] })
      .notNull()
      .default("in_progress"),
    startedAt: now("started_at"),
    completedAt: text("completed_at"),
  },
  (t) => [
    index("assessments_prospect_id_idx").on(t.prospectId),
    index("assessments_completed_at_idx").on(t.completedAt),
  ],
);

// Única tabla con datos potencialmente sensibles: nunca alcanzable desde el portal del distribuidor.
export const assessmentAnswers = sqliteTable(
  "assessment_answers",
  {
    id: id(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id),
    questionCode: text("question_code").notNull(),
    value: json<unknown>("value").notNull(),
  },
  (t) => [uniqueIndex("assessment_answers_unique").on(t.assessmentId, t.questionCode)],
);

export const assessmentResults = sqliteTable("assessment_results", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .unique()
    .references(() => assessments.id),
  engineVersion: text("engine_version").notNull(),
  areas: json<unknown>("areas").notNull(),
  analysisSummary: json<unknown>("analysis_summary").notNull(),
  medicalAttention: json<unknown>("medical_attention"),
  habits: json<unknown>("habits").notNull(),
  stopped: bool("stopped").notNull().default(false),
  // Copia exacta de lo que vio la persona (resultado + productos con precios del momento), para que el
  // enlace del correo muestre lo mismo aunque después cambien reglas o catálogo.
  snapshot: json<unknown>("snapshot"),
  createdAt: now("created_at"),
});

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: id(),
    assessmentResultId: text("assessment_result_id")
      .notNull()
      .references(() => assessmentResults.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    relevanceScore: real("relevance_score").notNull(),
    priorityLabel: text("priority_label", {
      enum: ["esencial", "prioritaria", "complementaria"],
    }).notNull(),
    reasonCodes: json<string[]>("reason_codes").notNull(),
  },
  (t) => [index("recommendations_result_idx").on(t.assessmentResultId)],
);

// Nunca se guarda video ni imagen: solo los valores derivados.
export const biometricReadings = sqliteTable("biometric_readings", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .unique()
    .references(() => assessments.id),
  provider: text("provider", { enum: ["vitallens", "shenai"] }).notNull().default("vitallens"),
  heartRateBpm: real("heart_rate_bpm"),
  respiratoryRateBpm: real("respiratory_rate_bpm"),
  // Solo Shen.AI: variabilidad cardiaca, índice de estrés (0–10) y actividad parasimpática (%).
  hrvSdnnMs: real("hrv_sdnn_ms"),
  hrvLnrmssdMs: real("hrv_lnrmssd_ms"),
  stressIndex: real("stress_index"),
  parasympatheticActivity: real("parasympathetic_activity"),
  capturedAt: now("captured_at"),
});

// Sesión efímera de escaneo: autoriza el proxy de VitalLens y registra la calidad de las señales que
// devolvió la API (nunca video). VitalLens calcula las frecuencias en el dispositivo; el servidor solo
// acepta una lectura si por su proxy pasó un escaneo real con señal de calidad suficiente.
export const scanSessions = sqliteTable("scan_sessions", {
  id: id(),
  createdAt: now("created_at"),
  expiresAt: text("expires_at").notNull(),
  apiRequests: integer("api_requests").notNull().default(0),
  signalChunks: integer("signal_chunks").notNull().default(0),
  ppgGoodChunks: integer("ppg_good_chunks").notNull().default(0),
  respGoodChunks: integer("resp_good_chunks").notNull().default(0),
  heartRateBpm: real("heart_rate_bpm"),
  heartRateConfidence: real("heart_rate_confidence"),
  respiratoryRateBpm: real("respiratory_rate_bpm"),
  respiratoryRateConfidence: real("respiratory_rate_confidence"),
  finishedAt: text("finished_at"),
});

// 3. Catálogo

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  line: text("line", { enum: ["nutriday_plus", "club_wenow"] }).notNull(),
  type: text("type", { enum: ["suplemento", "accesorio"] }).notNull(),
  name: text("name").notNull(),
  eyebrow: text("eyebrow").notNull(),
  benefit: text("benefit").notNull(),
  ingredients: text("ingredients").notNull(),
  ingredientSupport: text("ingredient_support").notNull(),
  usage: text("usage").notNull(),
  note: text("note").notNull(),
  publicPrice: integer("public_price").notNull(),
  distributorPrice: integer("distributor_price").notNull(),
  wholesaleBonus: integer("wholesale_bonus"),
  pvc: integer("pvc"),
  imageUrl: text("image_url"),
  active: bool("active").notNull().default(true),
  goals: json<Record<string, number>>("goals").notNull(),
  // Beneficios potenciales y "lo que podrías notar" del resultado; null si aún no hay copy revisado.
  highlights: json<ProductHighlights>("highlights"),
  currentVersionId: text("current_version_id"),
});

// Contenido de la ficha técnica de cada producto (scripts/data/fichas.json, generado con scripts/build-fichas.py).
export type FichaIngredient = {
  key: string; tag: string; name: string; sub: string; desc: string;
  comp: string[]; ben: string[]; dato: string;
};
export type Ficha = {
  name: string; family: string; category: string; tagline: string; about: string;
  facts: [string, string][]; quick: [string, string][]; strip: string;
  ben_title: string;
  // [icono, título, beneficios del catálogo, ingredientes que lo aportan, nota]
  benefits: [string, string, string[], string[], string | null][];
  science: { eyebrow: string; title: string; intro: string; steps: [string, string][] };
  ingredients: FichaIngredient[];
  // [nombre, claves de ingredientes, ingredientes en texto, descripción]
  synergies: [string, string[], string, string][];
  ritual: [string, string][]; ritual_note: string;
  combo: [string, string][]; reco: string[];
};

export type ProductHighlights = {
  ficha?: Ficha;
  summary: string;
  // Viñetas de BENEFICIOS textuales del catálogo de WeNow (fuente de verdad del cliente).
  catalogBenefits?: string[];
  benefits: { title: string; detail: string }[];
  timeline: { label: string; text: string }[];
};

export const productContentVersions = sqliteTable("product_content_versions", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  snapshot: json<unknown>("snapshot").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: now("approved_at"),
  notes: text("notes"),
});

export const recommendationRules = sqliteTable("recommendation_rules", {
  id: id(),
  ruleType: text("rule_type", { enum: ["exclusion", "incompatible_pair", "boost"] }).notNull(),
  condition: json<unknown>("condition").notNull(),
  effect: json<unknown>("effect").notNull(),
  reason: text("reason").notNull(),
  source: text("source"),
  reviewedAt: text("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export const questionnaireVersions = sqliteTable("questionnaire_versions", {
  id: text("id").primaryKey(),
  publishedAt: now("published_at"),
  publishedBy: text("published_by"),
  changelog: text("changelog"),
});

export const recommendationRuleVersions = sqliteTable("recommendation_rule_versions", {
  id: text("id").primaryKey(),
  publishedAt: now("published_at"),
  publishedBy: text("published_by"),
  changelog: text("changelog"),
});

// 4. Consentimiento y privacidad

export const consents = sqliteTable(
  "consents",
  {
    id: id(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id),
    consentType: text("consent_type", {
      enum: ["evaluacion", "datos_sensibles", "escaneo_biometrico", "contacto_asesor", "marketing"],
    }).notNull(),
    textVersion: text("text_version").notNull(),
    accepted: bool("accepted").notNull(),
    acceptedAt: now("accepted_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => [index("consents_assessment_idx").on(t.assessmentId)],
);

// Nunca guarda datos sensibles: solo referencias por ID.
export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorId: text("actor_id"),
  actorType: text("actor_type", { enum: ["admin", "distributor", "system"] }).notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  createdAt: now("created_at"),
});

// 5. Pipeline comercial

export const leadStatusHistory = sqliteTable(
  "lead_status_history",
  {
    id: id(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id),
    status: text("status", {
      enum: ["nuevo", "contactado", "en_seguimiento", "convertido", "no_interesado", "cerrado"],
    }).notNull(),
    changedBy: integer("changed_by").references(() => distributors.id),
    changedAt: now("changed_at"),
  },
  (t) => [index("lead_status_history_prospect_idx").on(t.prospectId)],
);

export const commercialNotes = sqliteTable("commercial_notes", {
  id: id(),
  prospectId: text("prospect_id")
    .notNull()
    .references(() => prospects.id),
  distributorId: integer("distributor_id")
    .notNull()
    .references(() => distributors.id),
  note: text("note").notNull(),
  createdAt: now("created_at"),
});

export const followUpTasks = sqliteTable("follow_up_tasks", {
  id: id(),
  assessmentResultId: text("assessment_result_id")
    .notNull()
    .references(() => assessmentResults.id),
  kind: text("kind", { enum: ["recordatorio_promo", "seguimiento"] }).notNull().default("seguimiento"),
  // ID del correo programado en Resend, para poder cancelarlo (baja o compra).
  providerEmailId: text("provider_email_id"),
  triggerType: text("trigger_type", { enum: ["automatico", "manual"] })
    .notNull()
    .default("automatico"),
  scheduledAt: text("scheduled_at"),
  productIdsToSuggest: json<string[]>("product_ids_to_suggest").notNull(),
  status: text("status", { enum: ["pendiente", "enviado", "cancelado"] })
    .notNull()
    .default("pendiente"),
});

// Conversaciones con el asistente (Gemini). Se conservan con el mismo plazo que la evaluación.
export const assistantMessages = sqliteTable(
  "assistant_messages",
  {
    id: id(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id),
    role: text("role", { enum: ["user", "model"] }).notNull(),
    content: text("content").notNull(),
    createdAt: now("created_at"),
  },
  (t) => [index("assistant_messages_assessment_idx").on(t.assessmentId)],
);

// 6. Operación

export const emailEvents = sqliteTable("email_events", {
  id: id(),
  assessmentId: text("assessment_id").references(() => assessments.id),
  recipient: text("recipient").notNull(),
  type: text("type", { enum: ["resultado", "notificacion_asesor", "copia_corporativa", "recordatorio_promo", "seguimiento", "compra_asesor", "compra_corporativa"] }).notNull(),
  provider: text("provider", { enum: ["resend", "hostinger"] }).notNull(),
  providerId: text("provider_id"),
  status: text("status", { enum: ["pending", "sent", "failed", "bounced"] })
    .notNull()
    .default("pending"),
  error: text("error"),
  createdAt: now("created_at"),
});

// Embudo del enlace de cada distribuidor: visitas e inicios de cuestionario. Sin datos personales.
export const funnelEvents = sqliteTable(
  "funnel_events",
  {
    id: id(),
    distributorSlug: text("distributor_slug").notNull(),
    kind: text("kind", { enum: ["visita", "inicio", "tienda"] }).notNull(),
    createdAt: now("created_at"),
  },
  (t) => [index("funnel_events_slug_idx").on(t.distributorSlug, t.createdAt)],
);

// Uso del chat público de Winnie (portada): contador diario por visitante (huella con hash) y global,
// para limitar el costo. No guarda mensajes ni datos personales.
export const winnieUsage = sqliteTable("winnie_usage", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: now("updated_at"),
});

// Pedidos pagados en la tienda (segunda fase de WeNow 360; hoy sin uso).
// y para ligar la compra con su WeNow 360. La dirección de envío no se guarda: solo viaja en el correo al asesor.
export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(), // id del pedido en Shopify
    orderName: text("order_name").notNull(),
    assessmentId: text("assessment_id").references(() => assessments.id),
    prospectId: text("prospect_id").references(() => prospects.id),
    distributorSlug: text("distributor_slug"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"),
    total: real("total").notNull(),
    membership: bool("membership").notNull().default(false),
    items: json<{ title: string; quantity: number; price: number }[]>("items").notNull(),
    paidAt: text("paid_at").notNull(),
    notifiedAt: text("notified_at"),
    createdAt: now("created_at"),
  },
  (t) => [index("purchases_distributor_idx").on(t.distributorSlug)],
);
