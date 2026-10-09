CREATE TABLE `custom_order_logs` (
	`order_id` integer NOT NULL,
	`day` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`order_id`, `day`),
	FOREIGN KEY (`order_id`) REFERENCES `custom_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `custom_order_logs_day_idx` ON `custom_order_logs` (`day`);--> statement-breakpoint
CREATE TABLE `custom_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arc_id` integer NOT NULL,
	`name` text NOT NULL,
	`unit` text DEFAULT '' NOT NULL,
	`min` integer NOT NULL,
	`full` integer NOT NULL,
	`first_day` text NOT NULL,
	`last_day` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `custom_orders_arc_idx` ON `custom_orders` (`arc_id`);--> statement-breakpoint
CREATE TABLE `task_completions` (
	`task_id` integer NOT NULL,
	`day` text NOT NULL,
	`done_at` text NOT NULL,
	PRIMARY KEY(`task_id`, `day`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`repeat` text NOT NULL,
	`day` text NOT NULL,
	`last_day` text,
	`carried_from` text,
	`is_dropped` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_day_idx` ON `tasks` (`day`);--> statement-breakpoint
ALTER TABLE `day_logs` ADD `result` text;