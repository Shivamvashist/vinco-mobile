CREATE TABLE `claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`period` text NOT NULL,
	`day` text NOT NULL,
	`denarii` integer NOT NULL,
	`gloria` integer NOT NULL,
	`truces` integer DEFAULT 0 NOT NULL,
	`claimed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claims_kind_key_period_idx` ON `claims` (`kind`,`key`,`period`);--> statement-breakpoint
CREATE INDEX `claims_day_idx` ON `claims` (`day`);