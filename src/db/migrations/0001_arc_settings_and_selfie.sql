ALTER TABLE `arcs` ADD `wake_time` text DEFAULT '06:30' NOT NULL;--> statement-breakpoint
ALTER TABLE `arcs` ADD `oath_path` text;--> statement-breakpoint
ALTER TABLE `day_logs` ADD `selfie_path` text;