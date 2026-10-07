CREATE TABLE `scan_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`expires_at` text NOT NULL,
	`api_requests` integer DEFAULT 0 NOT NULL,
	`heart_rate_bpm` real,
	`heart_rate_confidence` real,
	`respiratory_rate_bpm` real,
	`respiratory_rate_confidence` real,
	`finished_at` text
);
