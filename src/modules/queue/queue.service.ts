import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue as BullQueue } from 'bullmq';
import { QueueConfigService } from './queue-config.service';

export type YoutubeMetricsJobPayload = {
  provider: 'google';
  userId: number;
  tenantId: number;
  requestedAt: string;
  sync: {
    analyticsStatus: 'success' | 'warning';
    analyticsWarning: string | null;
    ingestionStatus: 'success' | 'warning';
    ingestionWarning: string | null;
    cacheStatus: 'success' | 'warning' | 'error';
    syncedAt: string;
  };
  summary: {
    videosCount: number;
    commentsCount: number;
    demographicsCount: number;
    contentItemsCount: number;
    metricsCount: number;
  };
  channel: {
    youtubeChannelId: string;
    channelTitle: string | null;
    subscriberCount: number;
    totalViewCount: number;
    videoCount: number;
  };
  analytics: {
    windowDays: number;
    rowsCount: number;
  };
  demographics: {
    ageGroups: Array<{ ageGroup: string; viewerPercentage: number }>;
    genders: Array<{ gender: string; viewerPercentage: number }>;
    countries: Array<{ country: string; viewerPercentage: number }>;
    startDate: string | null;
    endDate: string | null;
  };
  commentsSummary: {
    topCount: number;
    latestCount: number;
    sampleCount: number;
  };
  commentsByVideo: Array<{
    videoId: string;
    commentCount: number;
    topComments: Array<{
      commentId: string;
      textDisplay: string | null;
      textOriginal: string | null;
      authorDisplayName: string | null;
      authorChannelId: string | null;
      likeCount: number;
      publishedAt: string | null;
      updatedAt: string | null;
      commentType: 'top' | 'latest';
    }>;
    latestComments: Array<{
      commentId: string;
      textDisplay: string | null;
      textOriginal: string | null;
      authorDisplayName: string | null;
      authorChannelId: string | null;
      likeCount: number;
      publishedAt: string | null;
      updatedAt: string | null;
      commentType: 'top' | 'latest';
    }>;
    sampleComments: Array<{
      commentId: string;
      textDisplay: string | null;
      textOriginal: string | null;
      authorDisplayName: string | null;
      authorChannelId: string | null;
      likeCount: number;
      publishedAt: string | null;
      updatedAt: string | null;
      commentType: 'top' | 'latest';
    }>;
  }>;
  videos: Array<{
    youtubeVideoId: string;
    title: string | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    engagementRate: number;
    publishedAt: string | null;
  }>;
};

/**
 * BullMQ queue manager for job queueing and monitoring.
 * Handles queue creation, job enqueuing, backpressure, and DLQ routing.
 * All configuration is environment-driven; no hardcoded values.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<string, BullQueue> = new Map();
  private readonly dlqueues: Map<string, BullQueue> = new Map();

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
    queue.on('error', (error) => {
      this.logger.error(`Queue '${queueName}' error:`, error);
    });

    queue.on('waiting', (jobId) => {
      this.logger.debug(
        `Queue '${queueName}': job ${this.formatJobId(jobId)} waiting`,
      );
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

    dlq.on('error', (error) => {
      this.logger.error(`DLQ '${dlqName}' error:`, error);
    });

    this.dlqueues.set(dlqName, dlq);
    this.logger.log(`Created DLQ '${dlqName}'`);

    return Promise.resolve(dlq);
  }

  /**
   * Add job to the unified YouTube queue.
   * Job will be retried with exponential backoff if it fails.
   * After max retries, job moves to DLQ.
   *
   * @param payload YouTube ingestion job data
   * @param reason Optional description of why job was enqueued (for logging)
   * @returns Job ID
   */
  async addYoutubeMetricsJob(
    payload: YoutubeMetricsJobPayload,
    reason?: string,
  ): Promise<string> {
    const queueName = 'youtube';

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

    const jobName = 'youtube.ingestion';
    const retryConfig = this.queueConfig.getRetryConfig();

    try {
      const job = await queue.add(jobName, payload as Record<string, unknown>, {
        ...retryConfig,
        jobId: undefined, // Let BullMQ generate ID automatically
      });

      const reasonSuffix = reason ? ` (${reason})` : '';
      this.logger.log(
        `Enqueued YouTube ingestion job ${job.id} for user ${payload.userId}${reasonSuffix}`,
      );

      return job.id!;
    } catch (error) {
      this.logger.error(`Failed to enqueue YouTube ingestion job:`, error);
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

      const errorSuffix = error ? ` - Error: ${error}` : '';
      this.logger.error(
        `Moved job ${jobId} to DLQ '${dlqName}' - Reason: ${reason}${errorSuffix}`,
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

  private formatJobId(jobId: unknown): string {
    if (typeof jobId === 'string') {
      return jobId;
    }

    if (typeof jobId === 'number') {
      return String(jobId);
    }

    try {
      return JSON.stringify(jobId) ?? '[unserializable-job-id]';
    } catch {
      return '[unserializable-job-id]';
    }
  }
}
