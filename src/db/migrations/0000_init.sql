CREATE TABLE `arc_orders` (
	`arc_id` integer NOT NULL,
	`kind` text NOT NULL,
	`min` real NOT NULL,
	`full` real NOT NULL,
	`step` real NOT NULL,
	PRIMARY KEY(`arc_id`, `kind`),
	FOREIGN KEY (`arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `arcs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`length_days` integer NOT NULL,
	`start_day` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `arcs_status_idx` ON `arcs` (`status`);--> statement-breakpoint
CREATE TABLE `day_logs` (
	`day` text PRIMARY KEY NOT NULL,
	`woke_at` text,
	`stamped_at` text,
	`sealed_at` text,
	`truce_used` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_logs` (
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`day`, `kind`)
);
