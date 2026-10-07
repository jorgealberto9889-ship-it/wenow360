CREATE TABLE `assistant_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assistant_messages_assessment_idx` ON `assistant_messages` (`assessment_id`);