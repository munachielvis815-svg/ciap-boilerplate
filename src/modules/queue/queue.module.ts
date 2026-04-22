import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueConfigService } from './queue-config.service';
import { QueueService } from './queue.service';

/**
 * BullMQ Queue Module
 * Provides queue infrastructure for job processing.
 * Uses BullMQ with Redis backend.
 *
 * Configuration:
 * - REDIS_URL: Redis connection string (required, supports redis:// and rediss://)
 * - BULLMQ_PREFIX: Queue name prefix (default: "Queue")
 * - BULLMQ_MAX_RETRIES: Max retry attempts (default: 3)
 * - BULLMQ_BACKOFF_DELAY_MS: Initial backoff delay in ms (default: 3000)
 * - BULLMQ_QUEUE_BACKPRESSURE_LIMIT: Max queue depth before warning (default: 100)
 *
 * Usage:
 * ```typescript
 * // Inject QueueService
 * constructor(private readonly queue: QueueService) {}
 *
 * // Add job
 * const jobId = await this.queue.addYoutubeMetricsJob(payload);
 *
 * // Get stats
 * const stats = await this.queue.getQueueStats('youtube-metrics');
 * ```
 */
@Module({
  imports: [ConfigModule],
  providers: [QueueConfigService, QueueService],
  exports: [QueueService, QueueConfigService],
})
export class QueueModule {}
