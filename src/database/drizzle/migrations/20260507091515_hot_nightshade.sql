CREATE TABLE "youtube_audience_demographics" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"dimension_type" text NOT NULL,
	"dimension_value" text NOT NULL,
	"viewer_percentage" real DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_video_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"youtube_comment_id" text NOT NULL,
	"comment_type" text NOT NULL,
	"author_display_name" text,
	"author_channel_id" text,
	"text_display" text,
	"text_original" text,
	"like_count" integer DEFAULT 0,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "youtube_audience_demographics" ADD CONSTRAINT "youtube_audience_demographics_channel_id_youtube_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."youtube_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_video_comments" ADD CONSTRAINT "youtube_video_comments_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_audience_demographics_channel_id_idx" ON "youtube_audience_demographics" USING btree ("channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "youtube_audience_demographics_uq" ON "youtube_audience_demographics" USING btree ("channel_id","dimension_type","dimension_value","start_date","end_date");--> statement-breakpoint
CREATE INDEX "youtube_video_comments_video_id_idx" ON "youtube_video_comments" USING btree ("video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "youtube_video_comments_youtube_id_uq" ON "youtube_video_comments" USING btree ("youtube_comment_id");