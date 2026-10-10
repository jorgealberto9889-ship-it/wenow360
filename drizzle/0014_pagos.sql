CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`concept` text NOT NULL,
	`period_key` text NOT NULL,
	`amount_mxn` real NOT NULL,
	`status` text DEFAULT 'pagado' NOT NULL,
	`paid_at` text,
	`method` text DEFAULT '' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`invoice_url` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `payments_period_idx` ON `payments` (`period_key`);