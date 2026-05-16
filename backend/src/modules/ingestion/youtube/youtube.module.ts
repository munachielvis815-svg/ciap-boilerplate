import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { CacheModule } from '@modules/cache/cache.module';
import { DatabaseModule } from '@database/database.module';
import { HealthModule } from '@modules/health/health.module';
import { QueueModule } from '@modules/queue/queue.module';
import { YoutubeIngestionController } from './youtube.controller';
import { YoutubeIngestionService } from './services/youtube.service';
import { YoutubeRepository } from './repository/youtube.repository';
import { YoutubeMetricsRepository } from './repository/youtube-metrics.repository';
import { ContentRepository } from './repository/content.repository';
import { YoutubeMetricsProcessor } from './processor/youtube-metrics.processor';
import { YoutubeCacheService } from './services/youtube-cache.service';
import { YoutubeNormalizationService } from './services/youtube-normalization.service';

/**
 * YouTube Ingestion Module
 *
 * Owns complete YouTube metrics ingestion pipeline:
 * - Data fetching and normalization
 * - Cache management (local to this domain)
 * - Database persistence
 * - Metrics scoring and ML processing
 *
 * Clear separation:
 * - Cache: Owned locally via YoutubeCacheService
 * - Queue: Own queue.worker respects BullMQ patterns
 * - Metrics: Own processor handles scoring
 */
@Module({
  imports: [AuthModule, CacheModule, DatabaseModule, HealthModule, QueueModule],
  controllers: [YoutubeIngestionController],
  providers: [
    YoutubeIngestionService,
    YoutubeRepository,
    YoutubeMetricsRepository,
    ContentRepository,
    YoutubeMetricsProcessor,
    // YoutubeQueueWorker disabled: jobs are queued by YoutubeIngestionService
    // A separate ML microservice consumes these jobs from BullMQ
    // To enable worker: uncomment below and ensure REDIS_URL is correctly configured
    // YoutubeQueueWorker,
    YoutubeCacheService,
    YoutubeNormalizationService,
  ],
  exports: [
    YoutubeIngestionService,
    YoutubeRepository,
    YoutubeMetricsRepository,
  ],
})
export class YoutubeIngestionModule {}
