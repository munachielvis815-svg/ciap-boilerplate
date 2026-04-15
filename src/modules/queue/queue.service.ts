import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue as BullQueue } from 'bullmq';
import { QueueConfigService } from './queue-config.service';

export type YoutubeMetricsJobPayload = {
  provider: 'google';
  userId: number;
  tenantId: number;
  days: number;
  maxVideos: number;
  requestedAt: string;
  channelId?: string;
  cacheKey?: string;
};

export type CreatorInfluenceJobPayload = {
  source: 'youtube';
  userId: number;
  tenantId: number;
  channelId?: string;
  subscriberCount?: number;
  totalViewCount?: number;
  videoIds?: string[];
  analyticsCount?: number;
  requestedAt: string;
};

/**
 * BullMQ queue manager for job queueing and monitoring.
 * Handles queue creation, job enqueuing, backpressure, and DLQ routing.
 * All configuration is environment-driven; no hardcoded values.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, BullQueue> = new Map();
  private dlqueues: Map<string, BullQueue> = new Map();

  constructor(private readonly queueConfig: QueueConfigService) {}

  /**
   * Get or create a named queue.
   * Queues are singletons per queue name.
   */
  getQueue(queueName: string): Promise<BullQueue> {
    if (this.queues.has(queueName)) {
      return Promise.resolve(this.queues.get(queueName)!);
    }

    const config = this.queueConfig.getBaseConfig();
    const queue = new BullQueue(queueName, config);

    // Log queue events for monitoring
    queue.on('error', () => {
      this.logger.error(
        `Queue '${queueName}' error:`,
        new Error('Queue error'),
      );
    });

    queue.on('waiting', (jobId) => {
      this.logger.debug(`Queue '${queueName}': job ${String(jobId)} waiting`);
    });

    this.queues.set(queueName, queue);
    this.logger.log(`Created queue '${queueName}'`);

    return Promise.resolve(queue);
  }

  /**
   * Get or create a DLQ (Dead Letter Queue) for a given queue.
   */
  getDlq(queueName: string): Promise<BullQueue> {
    const dlqName = this.queueConfig.getDlqName(queueName);

    if (this.dlqueues.has(dlqName)) {
      return Promise.resolve(this.dlqueues.get(dlqName)!);
    }

    const config = this.queueConfig.getBaseConfig();
    const dlq = new BullQueue(dlqName, config);

    dlq.on('error', () => {
      this.logger.error(`DLQ '${dlqName}' error:`, new Error('DLQ error'));
    });

    this.dlqueues.set(dlqName, dlq);
    this.logger.log(`Created DLQ '${dlqName}'`);

    return Promise.resolve(dlq);
  }

  /**
   * Add job to YouTube metrics queue.
   * Job will be retried with exponential backoff if it fails.
   * After max retries, job moves to DLQ.
   *
   * @param payload YouTube metrics job data
   * @param reason Optional description of why job was enqueued (for logging)
   * @returns Job ID
   */
  async addYoutubeMetricsJob(
    payload: YoutubeMetricsJobPayload,
    reason?: string,
  ): Promise<string> {
    const queueName = 'youtube-metrics';

    // Check queue backpressure
    const queue = await this.getQueue(queueName);
    const queueDepth = await queue.count();

    if (queueDepth > this.queueConfig.getQueueBackpressureLimit()) {
      this.logger.warn(
        `Queue '${queueName}' backpressure: ${queueDepth} jobs pending (limit: ${this.queueConfig.getQueueBackpressureLimit()})`,
      );

      // Option 1: Reject (comment out if allowing jobs regardless of depth)
      // throw new Error(`Queue backpressure: ${queueDepth} jobs pending`);

      // Option 2: Allow but log warning (current behavior)
    }

    const jobName = 'youtube-metrics.pull';
    const retryConfig = this.queueConfig.getRetryConfig();

    try {
      const job = await queue.add(jobName, payload as Record<string, unknown>, {
        ...retryConfig,
        jobId: undefined, // Let BullMQ generate ID automatically
      });

      this.logger.log(
        `Enqueued YouTube metrics job ${job.id} for user ${payload.userId}${reason ? ` (${reason})` : ''}`,
      );

      return job.id!;
    } catch (error) {
      this.logger.error(`Failed to enqueue YouTube metrics job:`, error);
      throw error;
    }
  }

  async addCreatorInfluenceJob(
    payload: CreatorInfluenceJobPayload,
    reason?: string,
  ): Promise<string> {
    const queueName = 'creator-influence';
    const queue = await this.getQueue(queueName);
    const retryConfig = this.queueConfig.getRetryConfig();

    try {
      const job = await queue.add(
        'creator-influence.score',
        payload as Record<string, unknown>,
        {
          ...retryConfig,
          jobId: undefined,
        },
      );

      this.logger.log(
        `Enqueued creator influence job ${job.id} for user ${payload.userId}${reason ? ` (${reason})` : ''}`,
      );

      return job.id!;
    } catch (error) {
      this.logger.error(`Failed to enqueue creator influence job:`, error);
      throw error;
    }
  }

  /**
   * Move job to DLQ with failure reason and metadata.
   * Called by job processor when job exhausts retries or hits unrecoverable error.
   *
   * @param jobId Job ID that failed
   * @param queueName Original queue name
   * @param reason DLQ failure reason (e.g., 'youtube-rate-limit', 'invalid-channel-data')
   * @param error Optional error message
   */
  async moveJobToDlq(
    jobId: string,
    queueName: string,
    reason: string,
    error?: string,
  ): Promise<void> {
    const queue = await this.getQueue(queueName);
    const dlq = await this.getDlq(queueName);
    const dlqName = this.queueConfig.getDlqName(queueName);

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Job ${jobId} not found in queue ${queueName}`);
        return;
      }

      // Create DLQ job with original payload
      await dlq.add(job.name, job.data, {
        jobId: `${jobId}-dlq`,
        removeOnComplete: {
          age: 86400 * 7, // Keep DLQ jobs for 7 days
        },
      });

      // Mark original job as processed (remove from queue)
      await job.remove();

      this.logger.error(
        `Moved job ${jobId} to DLQ '${dlqName}' - Reason: ${reason}${error ? ` - Error: ${error}` : ''}`,
      );
    } catch (err) {
      this.logger.error(`Failed to move job ${jobId} to DLQ:`, err);
      throw err;
    }
  }

  /**
   * Get queue statistics for monitoring.
   */
  async getQueueStats(queueName: string) {
    const queue = await this.getQueue(queueName);
    const dlq = await this.getDlq(queueName);

    const [waiting, active, delayed, failed, completed, dlqCount] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
        queue.getCompletedCount(),
        dlq.count(),
      ]);

    return {
      queue: queueName,
      waiting,
      active,
      delayed,
      failed,
      completed,
      dlq: {
        name: this.queueConfig.getDlqName(queueName),
        count: dlqCount,
      },
    };
  }

  /**
   * Pause all queues on graceful shutdown.
   * Allows in-flight jobs to complete before connection closes.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // Pause all main queues
      await Promise.all(
        Array.from(this.queues.values()).map((queue) => queue.pause()),
      );

      // Close all connections
      await Promise.all(
        Array.from(this.queues.values()).map((queue) => queue.close()),
      );
      await Promise.all(
        Array.from(this.dlqueues.values()).map((dlq) => dlq.close()),
      );

      this.logger.log('Queue module destroyed: all queues paused and closed');
    } catch (error) {
      this.logger.error('Error during queue shutdown:', error);
    }
  }
}
