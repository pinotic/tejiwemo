CREATE TABLE "bidang" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bidang_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "report_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lini" text NOT NULL,
	"month" text NOT NULL,
	"note" text NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_notes_lini_month" UNIQUE("lini","month")
);
--> statement-breakpoint
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;