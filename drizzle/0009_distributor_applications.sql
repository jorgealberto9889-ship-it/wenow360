CREATE TABLE `distributor_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`slug` text NOT NULL,
	`email` text NOT NULL,
	`whatsapp` text NOT NULL,
	`distributor_number` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text,
	`distributor_ref` integer
);
--> statement-breakpoint
CREATE INDEX `distributor_applications_status_idx` ON `distributor_applications` (`status`);