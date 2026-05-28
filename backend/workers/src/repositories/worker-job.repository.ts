import { eq, inArray, and, sql } from 'drizzle-orm';
import type { SharedDatabase } from '@shared/database/client';
import { workerJobs, type WorkerJob } from '@shared/database/drizzle/schema';
import type { WorkerJobRecordInput, WorkerJobStatus } from '@shared/jobs/job-record';
import type { WorkerQueueName } from '@shared/queue/queue.constants';

export class WorkerJobRepository {
  constructor(private readonly db: SharedDatabase) {}

  async createJob(
    jobId: string,
    input: WorkerJobRecordInput,
  ): Promise<WorkerJob> {
    const [created] = await this.db
      .insert(workerJobs)
      .values({
        id: jobId,
        parentJobId: input.parentJobId ?? null,
        queueName: input.queueName,
        jobName: input.jobName,
        bullmqJobId: jobId,
        requestId: input.requestId,
        userId: input.userId ?? null,
        tenantId: input.tenantId ?? null,
        status: 'queued',
        attemptsMade: 0,
        maxAttempts: input.maxAttempts ?? 1,
        payload: input.payload ?? null,
        scheduledFor: input.scheduledFor ?? null,
      })
      .returning();

    return created;
  }

  async markActive(jobId: string): Promise<void> {
    await this.updateJob(jobId, {
      status: 'active',
      startedAt: new Date(),
      errorMessage: null,
      errorDetails: null,
    });
  }

  async markCompleted(
    jobId: string,
    result: Record<string, unknown> | null,
    attemptsMade: number,
  ): Promise<void> {
    await this.updateJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      attemptsMade,
      result,
      errorMessage: null,
      errorDetails: null,
    });
  }

  async markFailed(
    jobId: string,
    status: Extract<WorkerJobStatus, 'retrying' | 'failed'>,
    attemptsMade: number,
    error: unknown,
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : 'worker-job-failed';
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) };

    await this.updateJob(jobId, {
      status,
      attemptsMade,
      failedAt: new Date(),
      errorMessage,
      errorDetails,
    });
  }

  async hasOpenJobForUser(
    queueName: WorkerQueueName,
    userId: number,
  ): Promise<boolean> {
    const result = await this.db.execute(sql<{
      total: number;
    }>`
      select count(*)::int as total
      from worker_jobs
      where queue_name = ${queueName}
        and user_id = ${userId}
        and status in ('queued', 'active', 'retrying')
    `);

    return (Number((result.rows[0] as any)?.total) ?? 0) > 0;
  }

  private async updateJob(
    jobId: string,
    values: Partial<typeof workerJobs.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(workerJobs)
      .set(values)
      .where(eq(workerJobs.id, jobId));
  }
}
