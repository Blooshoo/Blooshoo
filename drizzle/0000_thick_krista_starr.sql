CREATE TABLE IF NOT EXISTS `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`cover_image` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`author_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`links` text DEFAULT '[]' NOT NULL,
	`image` text,
	`owner_type` text NOT NULL,
	`owner_name` text,
	`owner_id` integer,
	`featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);