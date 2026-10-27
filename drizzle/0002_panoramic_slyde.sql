CREATE TABLE `provider_checks` (
	`collection_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`entry_count` integer,
	`checked_at` text NOT NULL,
	`last_success` text,
	`fingerprint` text DEFAULT '' NOT NULL,
	`pending` integer DEFAULT 0 NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
ALTER TABLE `guide_contributions` ADD `author_alias` text DEFAULT 'Player' NOT NULL;