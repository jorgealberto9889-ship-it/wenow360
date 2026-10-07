CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `assessment_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`question_code` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_answers_unique` ON `assessment_answers` (`assessment_id`,`question_code`);--> statement-breakpoint
CREATE TABLE `assessment_results` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`engine_version` text NOT NULL,
	`areas` text NOT NULL,
	`analysis_summary` text NOT NULL,
	`medical_attention` text,
	`habits` text NOT NULL,
	`stopped` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_results_assessment_id_unique` ON `assessment_results` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text,
	`distributor_slug` text NOT NULL,
	`questionnaire_version` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessments_prospect_id_idx` ON `assessments` (`prospect_id`);--> statement-breakpoint
CREATE INDEX `assessments_completed_at_idx` ON `assessments` (`completed_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_type` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `biometric_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`provider` text DEFAULT 'vitallens' NOT NULL,
	`heart_rate_bpm` real,
	`respiratory_rate_bpm` real,
	`captured_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `biometric_readings_assessment_id_unique` ON `biometric_readings` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `commercial_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`distributor_id` integer NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`consent_type` text NOT NULL,
	`text_version` text NOT NULL,
	`accepted` integer NOT NULL,
	`accepted_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `consents_assessment_idx` ON `consents` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `distributors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`distributor_id` text,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`whatsapp` text NOT NULL,
	`store_url` text NOT NULL,
	`registration_url` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`portal_password_hash` text,
	`deactivated_reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `distributors_distributor_id_unique` ON `distributors` (`distributor_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `distributors_slug_unique` ON `distributors` (`slug`);--> statement-breakpoint
CREATE TABLE `email_events` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`recipient` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follow_up_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_result_id` text NOT NULL,
	`trigger_type` text DEFAULT 'automatico' NOT NULL,
	`scheduled_at` text,
	`product_ids_to_suggest` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	FOREIGN KEY (`assessment_result_id`) REFERENCES `assessment_results`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lead_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`status` text NOT NULL,
	`changed_by` integer,
	`changed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by`) REFERENCES `distributors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lead_status_history_prospect_idx` ON `lead_status_history` (`prospect_id`);--> statement-breakpoint
CREATE TABLE `legacy_biocheck_leads` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`distributor_slug` text NOT NULL,
	`accepted_result_email` integer NOT NULL,
	`accepted_marketing` integer DEFAULT false NOT NULL,
	`accepted_advisor_contact` integer DEFAULT false NOT NULL,
	`result_summary` text NOT NULL,
	`email_status` text NOT NULL,
	`advisor_email_status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_content_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`approved_by` text,
	`approved_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`notes` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`line` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`eyebrow` text NOT NULL,
	`benefit` text NOT NULL,
	`ingredients` text NOT NULL,
	`ingredient_support` text NOT NULL,
	`usage` text NOT NULL,
	`note` text NOT NULL,
	`public_price` integer NOT NULL,
	`distributor_price` integer NOT NULL,
	`wholesale_bonus` integer,
	`pvc` integer,
	`image_url` text,
	`active` integer DEFAULT true NOT NULL,
	`goals` text NOT NULL,
	`current_version_id` text
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`distributor_slug` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospects_distributor_slug_idx` ON `prospects` (`distributor_slug`);--> statement-breakpoint
CREATE INDEX `prospects_email_idx` ON `prospects` (`email`);--> statement-breakpoint
CREATE TABLE `questionnaire_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`published_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`published_by` text,
	`changelog` text
);
--> statement-breakpoint
CREATE TABLE `recommendation_rule_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`published_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`published_by` text,
	`changelog` text
);
--> statement-breakpoint
CREATE TABLE `recommendation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_type` text NOT NULL,
	`condition` text NOT NULL,
	`effect` text NOT NULL,
	`reason` text NOT NULL,
	`source` text,
	`reviewed_at` text,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_result_id` text NOT NULL,
	`product_id` text NOT NULL,
	`relevance_score` real NOT NULL,
	`priority_label` text NOT NULL,
	`reason_codes` text NOT NULL,
	FOREIGN KEY (`assessment_result_id`) REFERENCES `assessment_results`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `recommendations_result_idx` ON `recommendations` (`assessment_result_id`);