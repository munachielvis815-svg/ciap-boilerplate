ALTER TABLE "user_profiles" ADD COLUMN "creator_types" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;