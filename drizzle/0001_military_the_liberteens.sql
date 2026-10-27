CREATE TABLE `guide_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`guide_id` text NOT NULL,
	`kind` text NOT NULL,
	`platform` text NOT NULL,
	`game_build` text NOT NULL,
	`details` text NOT NULL,
	`evidence` text NOT NULL,
	`screenshot` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contributions_guide` ON `guide_contributions` (`guide_id`,`status`);--> statement-breakpoint
CREATE INDEX `contributions_user` ON `guide_contributions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `shared_playbooks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`payload` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shares_user` ON `shared_playbooks` (`user_id`);--> statement-breakpoint
CREATE TABLE `source_checks` (
	`url` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`http_status` integer NOT NULL,
	`checked_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_votes` (
	`user_id` text NOT NULL,
	`guide_id` text NOT NULL,
	`helpful` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `guide_id`)
);
