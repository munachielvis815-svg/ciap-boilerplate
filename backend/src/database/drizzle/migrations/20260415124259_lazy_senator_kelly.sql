CREATE TYPE "public"."content_platform" AS ENUM('youtube', 'tiktok', 'instagram', 'other');--> statement-breakpoint
CREATE TABLE "content_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_item_id" integer,
	"platform" "content_platform" NOT NULL,
	"conversion_type" text NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"conversion_value" real,
	"currency" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" "content_platform" NOT NULL,
	"external_id" text,
	"title" text,
	"description" text,
	"url" text,
	"thumbnail_url" text,
	"published_at" timestamp with time zone,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_item_id" integer,
	"platform" "content_platform" NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" real DEFAULT 0 NOT NULL,
	"metric_unit" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"display_name" text,
	"bio" text,
	"location" text,
	"industry" text,
	"website_url" text,
	"avatar_url" text,
	"audience_size" integer DEFAULT 0,
	"influence_score" real,
	"influence_score_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_conversions" ADD CONSTRAINT "content_conversions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_conversions" ADD CONSTRAINT "content_conversions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_conversions_user_id_idx" ON "content_conversions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_conversions_item_id_idx" ON "content_conversions" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_conversions_type_idx" ON "content_conversions" USING btree ("conversion_type");--> statement-breakpoint
CREATE INDEX "content_items_user_id_idx" ON "content_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_items_platform_idx" ON "content_items" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_platform_external_uq" ON "content_items" USING btree ("platform","external_id");--> statement-breakpoint
CREATE INDEX "content_metrics_user_id_idx" ON "content_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_metrics_item_id_idx" ON "content_metrics" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_metrics_name_idx" ON "content_metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "content_metrics_recorded_idx" ON "content_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_uq" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profiles_influence_idx" ON "user_profiles" USING btree ("influence_score");