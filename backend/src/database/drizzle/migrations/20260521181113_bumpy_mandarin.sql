CREATE TYPE "public"."sme_campaign_creator_status" AS ENUM('shortlisted', 'invited', 'active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."sme_campaign_status" AS ENUM('draft', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sme_scout_status" AS ENUM('scouted', 'contacted', 'archived');--> statement-breakpoint
CREATE TABLE "sme_campaign_creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_user_id" integer NOT NULL,
	"status" "sme_campaign_creator_status" DEFAULT 'shortlisted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sme_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"sme_user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "sme_campaign_status" DEFAULT 'draft' NOT NULL,
	"budget_amount" real,
	"budget_currency" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sme_scouted_creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"sme_user_id" integer NOT NULL,
	"creator_user_id" integer NOT NULL,
	"status" "sme_scout_status" DEFAULT 'scouted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sme_campaign_creators" ADD CONSTRAINT "sme_campaign_creators_campaign_id_sme_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."sme_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sme_campaign_creators" ADD CONSTRAINT "sme_campaign_creators_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sme_campaigns" ADD CONSTRAINT "sme_campaigns_sme_user_id_users_id_fk" FOREIGN KEY ("sme_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sme_scouted_creators" ADD CONSTRAINT "sme_scouted_creators_sme_user_id_users_id_fk" FOREIGN KEY ("sme_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sme_scouted_creators" ADD CONSTRAINT "sme_scouted_creators_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sme_campaign_creators_campaign_id_idx" ON "sme_campaign_creators" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "sme_campaign_creators_creator_user_id_idx" ON "sme_campaign_creators" USING btree ("creator_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sme_campaign_creators_campaign_creator_uq" ON "sme_campaign_creators" USING btree ("campaign_id","creator_user_id");--> statement-breakpoint
CREATE INDEX "sme_campaigns_sme_user_id_idx" ON "sme_campaigns" USING btree ("sme_user_id");--> statement-breakpoint
CREATE INDEX "sme_campaigns_status_idx" ON "sme_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sme_scouted_creators_sme_user_id_idx" ON "sme_scouted_creators" USING btree ("sme_user_id");--> statement-breakpoint
CREATE INDEX "sme_scouted_creators_creator_user_id_idx" ON "sme_scouted_creators" USING btree ("creator_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sme_scouted_creators_sme_creator_uq" ON "sme_scouted_creators" USING btree ("sme_user_id","creator_user_id");