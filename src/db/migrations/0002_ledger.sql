CREATE TABLE `ledger` (
	`day` text NOT NULL,
	`reason` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`day`, `reason`)
);
