ALTER TABLE `scan_sessions` ADD `signal_chunks` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD `ppg_good_chunks` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD `resp_good_chunks` integer DEFAULT 0 NOT NULL;