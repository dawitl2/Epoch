CREATE TABLE `api_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`country_code` text,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer NOT NULL
);
