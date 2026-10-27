CREATE TABLE `guide_edits` (
	`guide_id` text PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `player_records` (
	`user_id` text NOT NULL,
	`record_key` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `record_key`)
);
--> statement-breakpoint
CREATE TABLE `guide_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`guide_id` text NOT NULL,
	`kind` text NOT NULL,
	`platform` text NOT NULL,
	`game_build` text NOT NULL,
	`details` text NOT NULL,
	`evidence` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_user_time` ON `guide_reports` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `reports_status` ON `guide_reports` (`status`);--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guide_id` text NOT NULL,
	`payload` text NOT NULL,
	`editor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
