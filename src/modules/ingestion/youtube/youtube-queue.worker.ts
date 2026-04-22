import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker as BullWorker, Job } from 'bullmq';
import { QueueConfigService } from '@modules/queue/queue-config.service';
import { YoutubeMetricsJobPayload } from '@modules/queue/queue.service';
import { YoutubeMetricsProcessor } from './processor/youtube-metrics.processor';

/**
 * YouTube Queue Worker Registration
 * Registers and manages the BullMQ worker for YouTube metrics job processing.
 * Ensures graceful startup and shutdown of the worker.
 */
@Injectable()
export class YoutubeQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(YoutubeQueueWorker.name);
  private worker: BullWorker | null = null;

  constructor(
    private readonly queueConfig: QueueConfigService,
    private readonly processor: YoutubeMetricsProcessor,
  ) {}

  /**
   * Initialize and register the BullMQ worker when module loads.
   * Worker will start consuming jobs from the youtube-metrics queue.
   */
  onModuleInit(): void {
    try {
      const config = this.queueConfig.getBaseConfig();
      const queueName = 'youtube-metrics';

      this.worker = new BullWorker(
        queueName,
        async (job: Job<YoutubeMetricsJobPayload>) => {
          // Delegate to processor
          return this.processor.process(
            job as Job<YoutubeMetricsJobPayload, void, string>,
          );
        },
        {
          ...config,
          // Worker-specific options
          concurrency: parseInt(
            process.env.BULLMQ_WORKER_CONCURRENCY || '2',
            10,
          ),
          useWorkerThreads: true,
          autorun: true,
        },
      );

      // Listen to worker events for logging
      this.worker.on('completed', (job) => {
        this.logger.log(
          `[Worker] Job ${String(job.id)} completed successfully`,
        );
      });

      this.worker.on('failed', (job, error) => {
        this.logger.error(
          `[Worker] Job ${String(job?.id ?? 'unknown')} failed: ${error.message}`,
        );
      });

      this.worker.on('error', (error) => {
        this.logger.error(`[Worker] Worker error: ${error.message}`);
      });

      this.logger.log(
        `[Worker] YouTube metrics worker registered, concurrency: ${this.worker.opts.concurrency}`,
      );
    } catch (error) {
      this.logger.error(
        `[Worker] Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Gracefully shutdown the worker when module destroys.
   * Allows in-flight jobs to complete and closes connections.
   */
  async onModuleDestroy(): Promise<void> {
    if (!this.worker) return;

    try {
      this.logger.log('[Worker] Shutting down YouTube metrics worker...');
      await this.worker.close();
      this.logger.log('[Worker] Worker shut down completed');
    } catch (error) {
      this.logger.error(
        `[Worker] Error during shutdown: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get worker instance (for testing or advanced usage).
   */
  getWorker(): BullWorker | null {
    return this.worker;
  }
}
