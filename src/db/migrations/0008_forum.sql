CREATE TABLE `item_uses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` text NOT NULL,
	`day` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `item_uses_item_idx` ON `item_uses` (`item_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` text NOT NULL,
	`price` integer NOT NULL,
	`day` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `purchases_item_idx` ON `purchases` (`item_id`);