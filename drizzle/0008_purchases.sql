CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`order_name` text NOT NULL,
	`assessment_id` text,
	`prospect_id` text,
	`distributor_slug` text,
	`customer_name` text NOT NULL,
	`customer_email` text,
	`total` real NOT NULL,
	`membership` integer DEFAULT false NOT NULL,
	`items` text NOT NULL,
	`paid_at` text NOT NULL,
	`notified_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchases_distributor_idx` ON `purchases` (`distributor_slug`);