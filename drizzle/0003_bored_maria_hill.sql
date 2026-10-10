CREATE TABLE "bot_stats" (
	"id" integer PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp NOT NULL
);
