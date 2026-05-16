CREATE TYPE "public"."oauth_grant_purpose" AS ENUM('login', 'youtube-connect');--> statement-breakpoint
DROP INDEX "oauth_accounts_provider_identity_uq";--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "purpose" "oauth_grant_purpose" DEFAULT 'login' NOT NULL;--> statement-breakpoint
UPDATE "oauth_accounts"
SET "purpose" = 'youtube-connect'
WHERE "access_token" IS NOT NULL OR "refresh_token" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_user_provider_purpose_uq" ON "oauth_accounts" USING btree ("user_id","provider","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_provider_identity_purpose_uq" ON "oauth_accounts" USING btree ("provider","provider_user_id","purpose");
