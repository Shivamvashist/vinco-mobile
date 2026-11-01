CREATE TABLE `order_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`order_key` text NOT NULL,
	`amount` real NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_steps_day_idx` ON `order_steps` (`day`,`order_key`);--> statement-breakpoint
ALTER TABLE `day_logs` ADD `selfie_at` text;--> statement-breakpoint
ALTER TABLE `day_logs` ADD `weight_at` text;--> statement-breakpoint
ALTER TABLE `day_logs` ADD `calories_at` text;