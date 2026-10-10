CREATE TABLE `owner_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`service` text NOT NULL,
	`scope` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`input_units` integer DEFAULT 0 NOT NULL,
	`output_units` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `usage_events_service_idx` ON `usage_events` (`service`,`created_at`);