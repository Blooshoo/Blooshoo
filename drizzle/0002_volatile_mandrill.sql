CREATE TABLE "discord_allowlist" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"added_at" timestamp NOT NULL,
	"added_by" text
);
