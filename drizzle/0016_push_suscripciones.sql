CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`distributor_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`last_sent_at` text,
	FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_distributor_idx` ON `push_subscriptions` (`distributor_id`);