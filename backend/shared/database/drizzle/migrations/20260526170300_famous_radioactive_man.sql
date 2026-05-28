CREATE TYPE "public"."worker_job_status" AS ENUM('pending', 'queued', 'active', 'retrying', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "worker_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_job_id" uuid,
	"queue_name" text NOT NULL,
	"job_name" text NOT NULL,
	"bullmq_job_id" text NOT NULL,
	"request_id" text NOT NULL,
	"user_id" integer,
	"tenant_id" integer,
	"status" "worker_job_status" DEFAULT 'pending' NOT NULL,
	"attempts_made" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"scheduled_for" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"error_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_jobs_bullmq_job_id_unique" UNIQUE("bullmq_job_id")
);
--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_jobs_parent_job_id_idx" ON "worker_jobs" USING btree ("parent_job_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_queue_status_idx" ON "worker_jobs" USING btree ("queue_name","status");--> statement-breakpoint
CREATE INDEX "worker_jobs_request_id_idx" ON "worker_jobs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_user_id_idx" ON "worker_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_tenant_id_idx" ON "worker_jobs" USING btree ("tenant_id");