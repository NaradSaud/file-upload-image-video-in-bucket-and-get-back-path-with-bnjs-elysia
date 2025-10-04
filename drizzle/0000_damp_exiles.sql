CREATE TABLE "homes" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" serial NOT NULL,
	"address" varchar(512) NOT NULL,
	"images" text[]
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"profile_image" text
);
