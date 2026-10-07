CREATE TABLE `funnel_events` (
	`id` text PRIMARY KEY NOT NULL,
	`distributor_slug` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `funnel_events_slug_idx` ON `funnel_events` (`distributor_slug`,`created_at`);