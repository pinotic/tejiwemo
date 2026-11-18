CREATE TABLE "officers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"jabatan" text NOT NULL,
	"grup" text DEFAULT 'inti' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
