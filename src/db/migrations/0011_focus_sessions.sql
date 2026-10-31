CREATE TABLE `focus_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`guard` text NOT NULL,
	`minutes` integer NOT NULL,
	`started_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`ended_at` text,
	`status` text DEFAULT 'running' NOT NULL,
	`reward` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `focus_sessions_status_idx` ON `focus_sessions` (`status`);