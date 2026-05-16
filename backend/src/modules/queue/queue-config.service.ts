import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConnectionOptions, QueueOptions } from 'bullmq';

/**
 * BullMQ queue configuration provider.
 * Centralizes queue settings (retries, backoff, DLQ, etc.) from environment variables.
 * No hardcoded values; everything is configurable.
 */
@Injectable()
export class QueueConfigService {
  private readonly redisUrl: string;
  private readonly prefix: string;
  private readonly maxRetries: number;
  private readonly backoffDelayMs: number;
  private readonly queueBackpressureLimit: number;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.configService.get<string>('REDIS_URL') || '';
    this.prefix = this.configService.get<string>('BULLMQ_PREFIX') || 'Queue';
    this.maxRetries = this.configService.get<number>('BULLMQ_MAX_RETRIES') ?? 3;
    this.backoffDelayMs =
      this.configService.get<number>('BULLMQ_BACKOFF_DELAY_MS') ?? 3000;
    this.queueBackpressureLimit =
      this.configService.get<number>('BULLMQ_QUEUE_BACKPRESSURE_LIMIT') ?? 100;

    if (!this.redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
  }

  /**
   * Get queue base configuration (connection, naming).
   * All queues inherit these settings.
   */
  getBaseConfig(): QueueOptions {
    return {
      connection: this.parseRedisUrl(),
      prefix: this.prefix,
      defaultJobOptions: {
        // Retain completed jobs for 1 hour for audit/debugging
        removeOnComplete: {
          age: 3600,
        },
        // Retain failed jobs indefinitely (move to DLQ for inspection)
        removeOnFail: false,
      },
    };
  }

  /**
   * Get retry configuration.
   * Exponential backoff: 3s → 9s → 27s (default).
   * Can be overridden per job type.
   */
  getRetryConfig() {
    return {
      attempts: this.maxRetries + 1, // 4 total attempts (1 initial + 3 retries)
      backoff: {
        type: 'exponential',
        delay: this.backoffDelayMs, // 3000ms = 3s
      },
    };
  }

  /**
   * Check if queue depth requires backpressure (pause enqueuing new jobs).
   * Prevents job explosion during heavy load.
   */
  getQueueBackpressureLimit(): number {
    return this.queueBackpressureLimit;
  }

  /**
   * Get DLQ (Dead Letter Queue) name for a given queue.
   * Failed jobs after max retries are moved here.
   */
  getDlqName(queueName: string): string {
    return `${queueName}-dlq`;
  }

  /**
   * Parse Redis URL to connection options for BullMQ.
   * Supports redis:// and rediss:// URLs, ACL usernames, and /db indexes.
   */
  private parseRedisUrl(): ConnectionOptions {
    try {
      const url = new URL(this.redisUrl);
      if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
        throw new Error(`Unsupported Redis protocol: ${url.protocol}`);
      }

      const connection = {
        host: url.hostname,
        port: url.port ? Number.parseInt(url.port, 10) : 6379,
        username: url.username || undefined,
        password: url.password || undefined,
        db: this.parseRedisDbIndex(url),
        ...(url.protocol === 'rediss:'
          ? {
              tls: {
                servername: url.hostname,
              },
            }
          : {}),
      } satisfies ConnectionOptions;

      return connection;
    } catch (error) {
      throw new Error(
        `Invalid REDIS_URL format: ${this.redisUrl}${error instanceof Error ? ` (${error.message})` : ''}`,
      );
    }
  }

  private parseRedisDbIndex(url: URL): number {
    const pathname = url.pathname.replace(/^\/+/, '');

    if (!pathname) {
      return 0;
    }

    const db = Number.parseInt(pathname, 10);
    if (!Number.isInteger(db) || db < 0) {
      throw new Error('Redis database index must be a non-negative integer');
    }

    return db;
  }
}
