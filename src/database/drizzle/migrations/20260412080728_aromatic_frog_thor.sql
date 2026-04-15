CREATE TABLE "youtube_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"channel_title" text,
	"channel_description" text,
	"thumbnail_url" text,
	"subscriber_count" integer DEFAULT 0,
	"video_count" integer DEFAULT 0,
	"total_view_count" bigint DEFAULT 0,
	"upload_playlist_id" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_channels_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "youtube_daily_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"analytics_date" timestamp with time zone NOT NULL,
	"views" integer DEFAULT 0,
	"estimated_minutes_watched" integer DEFAULT 0,
	"average_view_duration_seconds" real DEFAULT 0,
	"subscribers_gained" integer DEFAULT 0,
	"subscribers_lost" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_ml_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"engagement_score" real NOT NULL,
	"growth_score" real NOT NULL,
	"recommendation_score" real NOT NULL,
	"performance_rank" integer,
	"scored_at" timestamp with time zone DEFAULT now() NOT NULL,
	"job_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"youtube_video_id" text NOT NULL,
	"video_title" text,
	"video_description" text,
	"duration_seconds" integer,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"published_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_videos_youtube_video_id_unique" UNIQUE("youtube_video_id")
);
--> statement-breakpoint
ALTER TABLE "youtube_channels" ADD CONSTRAINT "youtube_channels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_daily_analytics" ADD CONSTRAINT "youtube_daily_analytics_channel_id_youtube_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."youtube_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_ml_scores" ADD CONSTRAINT "youtube_ml_scores_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_videos" ADD CONSTRAINT "youtube_videos_channel_id_youtube_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."youtube_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_channels_user_id_idx" ON "youtube_channels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "youtube_channels_youtube_id_idx" ON "youtube_channels" USING btree ("youtube_channel_id");--> statement-breakpoint
CREATE INDEX "youtube_daily_analytics_channel_id_idx" ON "youtube_daily_analytics" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "youtube_daily_analytics_date_idx" ON "youtube_daily_analytics" USING btree ("analytics_date");--> statement-breakpoint
CREATE INDEX "youtube_ml_scores_video_id_idx" ON "youtube_ml_scores" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "youtube_ml_scores_job_id_idx" ON "youtube_ml_scores" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "youtube_ml_scores_scored_at_idx" ON "youtube_ml_scores" USING btree ("scored_at");--> statement-breakpoint
CREATE INDEX "youtube_videos_channel_id_idx" ON "youtube_videos" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "youtube_videos_youtube_id_idx" ON "youtube_videos" USING btree ("youtube_video_id");--> statement-breakpoint
CREATE INDEX "youtube_videos_published_at_idx" ON "youtube_videos" USING btree ("published_at");