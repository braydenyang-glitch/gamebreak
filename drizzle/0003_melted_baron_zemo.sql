CREATE TABLE `provider_refresh_locks` (
	`collection_id` text PRIMARY KEY NOT NULL,
	`attempted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `provider_snapshots` (
	`collection_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`retrieved_at` text NOT NULL
);
