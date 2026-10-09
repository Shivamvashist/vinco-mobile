CREATE TABLE `truces` (
	`day` text NOT NULL,
	`reason` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`day`, `reason`)
);
--> statement-breakpoint
-- An arc that began before Truces were called by hand gets its starting Truce now.
INSERT OR IGNORE INTO `truces` (`day`, `reason`, `amount`, `created_at`)
SELECT `start_day`, 'arc_start', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now') FROM `arcs` WHERE `status` = 'active';
