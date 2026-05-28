import { randomUUID } from 'node:crypto';
import {
  Queue,
  Worker,
  UnrecoverableError,
  type Job,
  type JobsOptions,
  type QueueOptions,
  type WorkerOptions,
} from 'bullmq';
import { createDatabase, createDatabasePool, type SharedDatabase } from '@shared/database/client';
import type { Pool } from 'pg';
import { parseRedisUrl } from '@shared/queue/redis-connection';
import { StructuredLogger } from '@shared/logging/structured-logger';
import type { WorkerEnv } from '../config/worker-env';
import {
  ML_INFERENCING_JOB,
  ML_INFERENCING_QUEUE,
  YOUTUBE_SYNC_BATCH_JOB,
  YOUTUBE_SYNC_BATCH_QUEUE,
  YOUTUBE_SYNC_JOB,
  YOUTUBE_SYNC_QUEUE,
  type MlInferencingJobPayload,
  type YoutubeSyncBatchJobPayload,
  type YoutubeSyncJobPayload,
} from '../queues/queue.constants';
import { WorkerJobRepository } from '../repositories/worker-job.repository';
import { WorkerYoutubeRepository } from '../repositories/worker-youtube.repository';
import { WorkerYoutubeSyncService } from './youtube-sync.service';
import { classifyDependencyError, assertQueueName } from '../utils/startup-guards';
import {
  WorkerConfigurationException,
  WorkerDependencyException,
} from '../exceptions/worker.exception';

export class WorkerQueueRuntimeService {
  private readonly logger = new StructuredLogger('WorkerQueueRuntimeService');
  private readonly pool: Pool;
  private readonly db: SharedDatabase;
  private readonly youtubeRepository: WorkerYoutubeRepository;
  private readonly jobRepository: WorkerJobRepository;
  private readonly syncService: WorkerYoutubeSyncService;
  private readonly queueOptions: QueueOptions;
  private readonly jobOptions: JobsOptions;
  private readonly batchQueue: Queue<YoutubeSyncBatchJobPayload>;
  private readonly syncQueue: Queue<YoutubeSyncJobPayload>;
  private readonly mlQueue: Queue<MlInferencingJobPayload>;

  private batchWorker?: Worker<YoutubeSyncBatchJobPayload>;
  private syncWorker?: Worker<YoutubeSyncJobPayload>;
  private mlWorker?: Worker<MlInferencingJobPayload>;
  private batchInterval?: NodeJS.Timeout;
  private mlInterval?: NodeJS.Timeout;
  private idleInterval?: NodeJS.Timeout;
  private lastNonIdleAt = Date.now();
  private stoppedByIdle = false;

  constructor(private readonly env: WorkerEnv) {
    try {
      this.pool = createDatabasePool(env.databaseUrl);
      this.db = createDatabase(this.pool);
      this.youtubeRepository = new WorkerYoutubeRepository(this.db);
      this.jobRepository = new WorkerJobRepository(this.db);
      this.syncService = new WorkerYoutubeSyncService(this.youtubeRepository, env);
      this.queueOptions = {
        connection: parseRedisUrl(env.redisUrl),
        prefix: env.bullPrefix,
        defaultJobOptions: {
          removeOnComplete: {
            age: 3600,
          },
          removeOnFail: false,
        },
      };
      this.jobOptions = {
        attempts: env.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: env.backoffDelayMs,
        },
      };
      this.batchQueue = new Queue<YoutubeSyncBatchJobPayload>(
        assertQueueName(YOUTUBE_SYNC_BATCH_QUEUE, 'YOUTUBE_SYNC_BATCH_QUEUE'),
        this.queueOptions,
      );
      this.syncQueue = new Queue<YoutubeSyncJobPayload>(
        assertQueueName(YOUTUBE_SYNC_QUEUE, 'YOUTUBE_SYNC_QUEUE'),
        this.queueOptions,
      );
      this.mlQueue = new Queue<MlInferencingJobPayload>(
        assertQueueName(ML_INFERENCING_QUEUE, 'ML_INFERENCING_QUEUE'),
        this.queueOptions,
      );
    } catch (error) {
      if (error instanceof WorkerConfigurationException) {
        throw error;
      }

      classifyDependencyError(error);
    }
  }

  async start(): Promise<void> {
    this.logger.info({
      message: 'Starting worker runtime',
      data: {
        batchScheduleMs: this.env.youtubeSyncBatchScheduleMs,
        mlScheduleMs: this.env.mlScheduleMs,
        batchConcurrency: this.env.youtubeSyncBatchConcurrency,
        syncConcurrency: this.env.youtubeSyncConcurrency,
        mlConcurrency: this.env.mlConcurrency,
        schedulerEnabled: this.env.schedulerEnabled,
        exitOnIdle: this.env.exitOnIdle,
        idleTimeoutMs: this.env.idleTimeoutMs,
      },
    });

    await this.assertDatabaseReady();

    this.batchWorker = new Worker(
      YOUTUBE_SYNC_BATCH_QUEUE,
      async (job) =>
        this.runJob(job, async () =>
          this.handleBatchJob(job.id!, job.data),
        ),
      this.createWorkerOptions(this.env.youtubeSyncBatchConcurrency),
    );

    this.syncWorker = new Worker(
      YOUTUBE_SYNC_QUEUE,
      async (job) =>
        this.runJob(job, async () =>
          this.syncService.syncUser(
            job.data.userId,
            job.data.tenantId,
            job.data.requestId,
            job.id!,
          ),
        ),
      this.createWorkerOptions(this.env.youtubeSyncConcurrency),
    );

    this.mlWorker = new Worker(
      ML_INFERENCING_QUEUE,
      async (job) =>
        this.runJob(job, async () =>
          this.handleMlJob(job.id!, job.data),
        ),
      this.createWorkerOptions(this.env.mlConcurrency),
    );

    if (this.env.schedulerEnabled) {
      this.batchInterval = setInterval(() => {
        void this.enqueueBatchJob('scheduler');
      }, this.env.youtubeSyncBatchScheduleMs);
      this.mlInterval = setInterval(() => {
        void this.enqueueMlJob();
      }, this.env.mlScheduleMs);

      await this.enqueueBatchJob('scheduler');
      await this.enqueueMlJob();
    }

    if (this.env.exitOnIdle) {
      if (this.env.schedulerEnabled) {
        this.logger.warn({
          message: 'Exit-on-idle disabled because scheduler is enabled',
        });
      } else {
        this.startIdleMonitor();
      }
    }
  }

  async stop(): Promise<void> {
    if (this.stoppedByIdle) {
      return;
    }

    this.logger.info({
      message: 'Stopping worker runtime',
    });

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    if (this.mlInterval) {
      clearInterval(this.mlInterval);
    }
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
    }

    await Promise.all([
      this.batchWorker?.close(),
      this.syncWorker?.close(),
      this.mlWorker?.close(),
      this.batchQueue.close(),
      this.syncQueue.close(),
      this.mlQueue.close(),
      this.pool.end(),
    ]);

    this.logger.info({
      message: 'Worker runtime stopped',
    });
  }

  async getHealth(): Promise<Record<string, unknown>> {
    return {
      batchQueue: await this.batchQueue.count(),
      syncQueue: await this.syncQueue.count(),
      mlQueue: await this.mlQueue.count(),
    };
  }

  private createWorkerOptions(concurrency: number): WorkerOptions {
    return {
      connection: parseRedisUrl(this.env.redisUrl),
      prefix: this.env.bullPrefix,
      concurrency,
    };
  }

  private async enqueueBatchJob(
    reason: YoutubeSyncBatchJobPayload['reason'],
  ): Promise<void> {
    const requestId = randomUUID();
    const jobId = randomUUID();
    const payload: YoutubeSyncBatchJobPayload = {
      requestId,
      reason,
      scheduledAt: new Date().toISOString(),
    };

    await this.jobRepository.createJob(jobId, {
      queueName: YOUTUBE_SYNC_BATCH_QUEUE,
      jobName: YOUTUBE_SYNC_BATCH_JOB,
      requestId,
      payload,
      scheduledFor: new Date(),
      maxAttempts: this.jobOptions.attempts,
    });

    this.logger.info({
      message: 'Enqueuing batch job',
      requestId,
      jobId,
      queue: YOUTUBE_SYNC_BATCH_QUEUE,
      data: {
        reason,
      },
    });

    await this.batchQueue.add(YOUTUBE_SYNC_BATCH_JOB, payload, {
      ...this.jobOptions,
      jobId,
    });

    this.lastNonIdleAt = Date.now();
  }

  private async enqueueMlJob(): Promise<void> {
    const requestId = randomUUID();
    const jobId = randomUUID();
    const payload: MlInferencingJobPayload = {
      requestId,
      scheduledAt: new Date().toISOString(),
      reason: 'scheduler',
      placeholder: true,
    };

    await this.jobRepository.createJob(jobId, {
      queueName: ML_INFERENCING_QUEUE,
      jobName: ML_INFERENCING_JOB,
      requestId,
      payload,
      scheduledFor: new Date(),
      maxAttempts: this.jobOptions.attempts,
    });

    this.logger.info({
      message: 'Enqueuing ML placeholder job',
      requestId,
      jobId,
      queue: ML_INFERENCING_QUEUE,
    });

    await this.mlQueue.add(ML_INFERENCING_JOB, payload, {
      ...this.jobOptions,
      jobId,
    });

    this.lastNonIdleAt = Date.now();
  }

  private async handleBatchJob(
    parentJobId: string,
    payload: YoutubeSyncBatchJobPayload,
  ): Promise<Record<string, unknown>> {
    const staleBefore = new Date(
      Date.now() - this.env.youtubeSyncStaleAfterMinutes * 60_000,
    );
    const users = await this.youtubeRepository.findDueYoutubeSyncUsers(
      staleBefore,
      this.env.youtubeSyncBatchSize,
    );

    await Promise.all(
      users.map(async (user) => {
        const hasOpenJob = await this.jobRepository.hasOpenJobForUser(
          YOUTUBE_SYNC_QUEUE,
          user.userId,
        );
        if (hasOpenJob) {
          this.logger.info({
            message: 'Skipping enqueue for active YouTube sync job',
            requestId: payload.requestId,
            queue: YOUTUBE_SYNC_QUEUE,
            data: {
              userId: user.userId,
              tenantId: user.tenantId,
            },
          });
          return;
        }

        const jobId = randomUUID();
        const jobPayload: YoutubeSyncJobPayload = {
          requestId: payload.requestId,
          userId: user.userId,
          tenantId: user.tenantId,
          reason: 'batch',
          scheduledAt: new Date().toISOString(),
        };

        await this.jobRepository.createJob(jobId, {
          queueName: YOUTUBE_SYNC_QUEUE,
          jobName: YOUTUBE_SYNC_JOB,
          requestId: payload.requestId,
          userId: user.userId,
          tenantId: user.tenantId,
          parentJobId,
          payload: jobPayload,
          scheduledFor: new Date(),
          maxAttempts: this.jobOptions.attempts,
        });

        await this.syncQueue.add(YOUTUBE_SYNC_JOB, jobPayload, {
          ...this.jobOptions,
          jobId,
        });
      }),
    );

    this.logger.info({
      message: 'Batch job enqueued due YouTube sync users',
      requestId: payload.requestId,
      jobId: parentJobId,
      data: {
        enqueuedUsers: users.length,
        userIds: users.map((user) => user.userId),
      },
    });

    return {
      enqueuedUsers: users.length,
      userIds: users.map((user) => user.userId),
    };
  }

  private async handleMlJob(
    jobId: string,
    payload: MlInferencingJobPayload,
  ): Promise<Record<string, unknown>> {
    this.logger.info({
      message: 'ML placeholder job executed',
      requestId: payload.requestId,
      jobId,
      data: {
        mlBaseUrl: this.env.mlBaseUrl,
      },
    });

    return {
      placeholder: true,
      mlBaseUrl: this.env.mlBaseUrl,
      message: 'ML inferencing placeholder only',
    };
  }

  private async runJob<T>(
    job: Job,
    handler: () => Promise<T>,
  ): Promise<T> {
    const jobId = job.id!;
    const requestId =
      typeof job.data === 'object' &&
      job.data !== null &&
      'requestId' in job.data &&
      typeof job.data.requestId === 'string'
        ? job.data.requestId
        : null;

    this.logger.info({
      message: 'Worker job started',
      requestId,
      jobId,
      queue: job.queueName,
      data: {
        name: job.name,
        attemptsMade: job.attemptsMade,
      },
    });

    await this.jobRepository.markActive(jobId);
    this.lastNonIdleAt = Date.now();

    try {
      const result = await handler();
      await this.jobRepository.markCompleted(
        jobId,
        (result as Record<string, unknown>) ?? null,
        job.attemptsMade + 1,
      );
      this.lastNonIdleAt = Date.now();
      this.logger.info({
        message: 'Worker job completed',
        requestId,
        jobId,
        queue: job.queueName,
        data: {
          name: job.name,
          attemptsMade: job.attemptsMade + 1,
        },
      });
      return result;
    } catch (error) {
      const attemptsMade = job.attemptsMade + 1;
      const maxAttempts = job.opts.attempts ?? 1;
      const isUnrecoverable = error instanceof UnrecoverableError;
      await this.jobRepository.markFailed(
        jobId,
        attemptsMade >= maxAttempts || isUnrecoverable ? 'failed' : 'retrying',
        attemptsMade,
        error,
      );
      this.lastNonIdleAt = Date.now();
      this.logger.error({
        message: 'Worker job failed',
        requestId,
        jobId,
        queue: job.queueName,
        data: {
          name: job.name,
          attemptsMade,
          unrecoverable: isUnrecoverable,
        },
        error,
      });
      throw error;
    }
  }

  private startIdleMonitor(): void {
    const checkIntervalMs = 5_000;
    this.lastNonIdleAt = Date.now();

    this.idleInterval = setInterval(() => {
      void this.checkIdleAndExit();
    }, checkIntervalMs);
  }

  private async checkIdleAndExit(): Promise<void> {
    if (this.stoppedByIdle) {
      return;
    }

    const counts = await Promise.all([
      this.batchQueue.getJobCounts('waiting', 'active', 'delayed', 'paused'),
      this.syncQueue.getJobCounts('waiting', 'active', 'delayed', 'paused'),
      this.mlQueue.getJobCounts('waiting', 'active', 'delayed', 'paused'),
    ]);

    const total = counts.reduce(
      (sum, entry) =>
        sum +
        (entry.waiting || 0) +
        (entry.active || 0) +
        (entry.delayed || 0) +
        (entry.paused || 0),
      0,
    );

    if (total > 0) {
      this.lastNonIdleAt = Date.now();
      return;
    }

    const idleForMs = Date.now() - this.lastNonIdleAt;
    if (idleForMs < this.env.idleTimeoutMs) {
      return;
    }

    this.stoppedByIdle = true;
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = undefined;
    }

    this.logger.info({
      message: 'Worker idle threshold reached; stopping workers',
      data: {
        idleForMs,
      },
    });
    await this.stop();
  }

  private async assertDatabaseReady(): Promise<void> {
    try {
      const result = await this.pool.query(
        'select to_regclass($1) as name',
        ['public.worker_jobs'],
      );
      const tableName = result.rows[0]?.name as string | null | undefined;

      if (!tableName) {
        throw new WorkerDependencyException(
          'Worker database is missing required tables. Apply migrations before starting workers.',
          { table: 'worker_jobs' },
        );
      }

      this.logger.info({
        message: 'Worker database is ready',
        data: {
          table: tableName,
        },
      });
    } catch (error) {
      if (error instanceof WorkerDependencyException) {
        this.logger.error({
          message: 'Worker database is not ready',
          error,
          data: {
            table: 'worker_jobs',
          },
        });
        throw error;
      }

      this.logger.error({
        message: 'Worker database readiness check failed',
        error,
      });
      classifyDependencyError(error);
    }
  }
}
