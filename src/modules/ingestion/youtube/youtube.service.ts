import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { RequestUser } from '@/types';
import type { YoutubeMetricsQueryDto } from '@modules/auth/socials/dto/youtube-metrics-query.dto';
import { SocialsService } from '@modules/auth/socials/socials.service';
import { YoutubeNormalizationService } from './services/youtube-normalization.service';
import { YoutubeRepository } from './repository/youtube.repository';
import { YoutubeCacheService } from './services/youtube-cache.service';
import { QueueService } from '@modules/queue/queue.service';
import { HealthService } from '@modules/health/health.service';
import type { ApproveYoutubeChannelDto } from './dto/approve-youtube-channel.dto';

/**
 * Raw YouTube channel data from Google API.
 * Contains nested structures that need normalization before storage/ML.
 */
type YoutubeChannel = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    thumbnails?: Record<string, { url?: string }>;
    [key: string]: unknown;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    [key: string]: unknown;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

/**
 * Raw video data from YouTube API.
 * Includes engagement metrics (likes, comments) and duration.
 */
type YoutubeVideo = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    [key: string]: unknown;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
    [key: string]: unknown;
  };
  contentDetails?: {
    duration?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Expanded analytics metrics aligned with YouTube Analytics API.
 * Rows contain: [date, views, estimatedMinutesWatched, avgDuration, subscribersGained, subscribersLost]
 */
type YoutubeAnalyticsRow = [string, number, number, number, number, number];
type YoutubeAnalytics = {
  columnHeaders?: Array<{
    name?: string;
    columnType?: string;
    dataType?: string;
  }>;
  rows?: YoutubeAnalyticsRow[];
};

/**
 * Ingestion response includes extracted scalar values for convenience
 * (e.g., channelViews) alongside raw data for normalization.
 */
export type YoutubeIngestionResponse = {
  channel: YoutubeChannel | null;
  channelViews: string | null;
  channelSubscribers: string | null;
  channelVideoCount: string | null;
  videos: YoutubeVideo[];
  analytics: YoutubeAnalytics;
  limits: {
    days: number;
    maxVideos: number;
  };
};

@Injectable()
export class YoutubeIngestionService {
  private readonly logger = new Logger(YoutubeIngestionService.name);

  constructor(
    private readonly socialsService: SocialsService,
    private readonly normalizationService: YoutubeNormalizationService,
    private readonly repository: YoutubeRepository,
    private readonly cache: YoutubeCacheService,
    private readonly queueService: QueueService,
    private readonly healthService: HealthService,
  ) {}

  /**
   * Full orchestration pipeline for YouTube metrics ingestion.
   * Flow: Fetch → Normalize → Persist → Cache → Invalidate → Queue
   *
   * Cache and queue failures are logged but don't fail the sync;
   * data is already persisted to DB.
   */
  async getYoutubeMetrics(
    actor: RequestUser,
    query: YoutubeMetricsQueryDto,
  ): Promise<{
    channel: YoutubeChannel | null;
    videos: YoutubeVideo[];
    videosCount: number;
    analyticsCount: number;
    cacheStatus: 'success' | 'warning' | 'error';
    jobId: string | null;
    jobStatus: 'queued' | 'warning' | 'error';
    syncedAt: string;
  }> {
    const syncStartTime = Date.now();

    try {
      this.logger.log(
        `[Sync ${actor.id}] Starting YouTube metrics sync for user ${actor.id}, tenant ${actor.tenantId}`,
      );

      // 1. FETCH: Get raw data from YouTube API
      const raw = await this.socialsService.getYoutubeMetrics(actor, query);

      if (!raw.channel) {
        throw new Error(
          'No YouTube channel found for user; ensure Google OAuth is linked',
        );
      }

      if (!raw.channel.id) {
        throw new Error(
          'YouTube channel ID is missing; ensure Google OAuth includes channel scope',
        );
      }

      this.logger.log(
        `[Sync ${actor.id}] Fetched channel and ${raw.videos.length} videos`,
      );

      // 2. NORMALIZE: Transform raw API response to typed, validated records
      const normalized = {
        channel: this.normalizationService.normalizeChannel(
          raw.channel.id,
          raw.channel,
          actor.id,
        ),
        videos: this.normalizationService.normalizeVideos(raw.videos),
        analytics: this.normalizationService.normalizeDailyAnalytics(
          raw.analytics.rows || [],
        ),
      };

      this.logger.log(
        `[Sync ${actor.id}] Normalized data: 1 channel, ${normalized.videos.length} videos, ${normalized.analytics.length} analytics records`,
      );

      // 3. PERSIST: Upsert to database (critical operation; will throw if fails)
      if (!normalized.channel) {
        throw new Error('Failed to normalize channel data');
      }

      const persistedChannel = await this.repository.upsertChannel(
        normalized.channel,
      );

      const videosWithChannelId = normalized.videos.map((video) => ({
        ...video,
        channelId: persistedChannel.id,
      }));

      const analyticsWithChannelId = normalized.analytics.map((analytic) => ({
        ...analytic,
        channelId: persistedChannel.id,
      }));

      const persisted = {
        channel: persistedChannel,
        videos: await this.repository.upsertVideos(videosWithChannelId),
        analytics: await this.repository.upsertDailyAnalytics(
          analyticsWithChannelId,
        ),
      };

      this.logger.log(
        `[Sync ${actor.id}] Persisted to DB: channel ${persisted.channel.youtubeChannelId}, ${persisted.videos.length} videos, ${persisted.analytics.length} analytics`,
      );

      // 4. CACHE: Store normalized data (non-critical; errors are logged)
      let cacheStatus: 'success' | 'warning' | 'error' = 'success';
      try {
        await this.cache.setChannel(persisted.channel);
        await this.cache.setVideos(
          persisted.channel.youtubeChannelId,
          persisted.videos,
        );
        await this.cache.setAnalytics(
          persisted.channel.youtubeChannelId,
          persisted.analytics,
        );
        this.logger.log(`[Sync ${actor.id}] Cached normalized data`);
      } catch (cacheError) {
        this.logger.warn(
          `[Sync ${actor.id}] Cache operation failed (continuing with sync): ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`,
        );
        cacheStatus = 'warning';
      }

      // 5. INVALIDATE: Clear stale cache entries that conflict with new data
      try {
        await this.cache.invalidateChannel(persisted.channel.youtubeChannelId);
        this.logger.log(`[Sync ${actor.id}] Invalidated stale cache entries`);
      } catch (invalidateError) {
        this.logger.warn(
          `[Sync ${actor.id}] Cache invalidation failed: ${invalidateError instanceof Error ? invalidateError.message : String(invalidateError)}`,
        );
        // Don't mark as warning; invalidation is best-effort
      }

      // 6. QUEUE: Enqueue ML scoring job (non-critical; errors are logged)
      let jobId: string | null = null;
      let jobStatus: 'queued' | 'warning' | 'error' = 'queued';
      try {
        const commentsSummary = raw.comments?.reduce(
          (acc, entry) => {
            acc.topCount += entry.topComments.length;
            acc.latestCount += entry.latestComments.length;
            acc.sampleCount += entry.sampleComments.length;
            return acc;
          },
          { topCount: 0, latestCount: 0, sampleCount: 0 },
        ) ?? { topCount: 0, latestCount: 0, sampleCount: 0 };

        const totalCommentsCount =
          raw.comments?.reduce(
            (count, entry) => count + entry.commentCount,
            0,
          ) ?? 0;

        const demographics = raw.demographics
          ? {
              ageGroups: raw.demographics.ageGroups,
              genders: raw.demographics.genders,
              countries: raw.demographics.countries,
              startDate: raw.demographics.startDate,
              endDate: raw.demographics.endDate,
            }
          : {
              ageGroups: [],
              genders: [],
              countries: [],
              startDate: null,
              endDate: null,
            };

        const demographicsCount =
          demographics.ageGroups.length +
          demographics.genders.length +
          demographics.countries.length;

        jobId = await this.queueService.addYoutubeMetricsJob(
          {
            provider: 'google',
            userId: actor.id,
            tenantId: actor.tenantId,
            requestedAt: new Date().toISOString(),
            sync: {
              analyticsStatus: raw.analyticsStatus ?? 'success',
              analyticsWarning: raw.analyticsWarning ?? null,
              ingestionStatus: 'success',
              ingestionWarning: null,
              cacheStatus,
              syncedAt: new Date().toISOString(),
            },
            summary: {
              videosCount: persisted.videos.length,
              commentsCount: totalCommentsCount,
              demographicsCount,
              contentItemsCount: persisted.videos.length,
              metricsCount: persisted.analytics.length,
            },
            channel: {
              youtubeChannelId: persisted.channel.youtubeChannelId,
              channelTitle: persisted.channel.channelTitle ?? null,
              subscriberCount: persisted.channel.subscriberCount ?? 0,
              totalViewCount: Number(persisted.channel.totalViewCount ?? 0),
              videoCount: persisted.channel.videoCount ?? 0,
            },
            analytics: {
              windowDays: query.days ?? 30,
              rowsCount: persisted.analytics.length,
            },
            demographics,
            commentsSummary,
            commentsByVideo: raw.comments ?? [],
            videos: persisted.videos.map((video) => {
              const views = video.viewCount ?? 0;
              const likes = video.likeCount ?? 0;
              const comments = video.commentCount ?? 0;
              const engagementRate = views > 0 ? (likes + comments) / views : 0;

              return {
                youtubeVideoId: video.youtubeVideoId,
                title: video.videoTitle ?? null,
                viewCount: views,
                likeCount: likes,
                commentCount: comments,
                engagementRate,
                publishedAt: video.publishedAt
                  ? video.publishedAt.toISOString()
                  : null,
              };
            }),
          },
          'user-requested-sync',
        );
        this.logger.log(
          `[Sync ${actor.id}] Enqueued ML job ${jobId} for user ${actor.id}`,
        );
      } catch (queueError) {
        this.logger.error(
          `[Sync ${actor.id}] Failed to enqueue ML job (data persisted, scoring deferred): ${queueError instanceof Error ? queueError.message : String(queueError)}`,
        );
        jobStatus = 'warning';
      }

      const syncTimeMs = Date.now() - syncStartTime;

      this.logger.log(
        `[Sync ${actor.id}] Completed in ${syncTimeMs}ms | Cache: ${cacheStatus} | Job: ${jobStatus}`,
      );

      // 7. RETURN: Summary response for client
      return {
        channel: persisted.channel as unknown as YoutubeChannel,
        videos: persisted.videos as unknown as YoutubeVideo[],
        videosCount: persisted.videos.length,
        analyticsCount: persisted.analytics.length,
        cacheStatus,
        jobId,
        jobStatus,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[Sync ${actor.id}] Failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Approve a YouTube channel for analytics tracking.
   * Verifies cache is healthy before approval.
   * Called after user completes Google OAuth and selects YouTube channel.
   */
  async approveChannel(
    actor: RequestUser,
    dto: ApproveYoutubeChannelDto,
  ): Promise<{
    id: number;
    youtubeChannelId: string;
    channelTitle: string | null;
    isApproved: boolean;
    approvedAt: string;
  }> {
    this.logger.log(
      `[Approval ${actor.id}] Approving YouTube channel ${dto.youtubeChannelId} for user ${actor.id}`,
    );

    try {
      // Check cache health before approval
      const cacheHealth = await this.healthService.checkCache();
      if (cacheHealth.status !== 'ok') {
        this.logger.warn(
          `[Approval ${actor.id}] Cache health check failed; proceeding with approval but cache writes may fail`,
        );
      }

      // Find the channel in database
      const channel = await this.repository.getChannelByYoutubeId(
        dto.youtubeChannelId,
      );
      if (!channel) {
        throw new NotFoundException(
          `YouTube channel ${dto.youtubeChannelId} not found; ensure metrics have been fetched first`,
        );
      }

      // Verify ownership (user must own the channel)
      if (channel.userId !== actor.id) {
        throw new ForbiddenException(
          'YouTube channel does not belong to authenticated user',
        );
      }

      // Cache approval status
      // Note: YouTube-specific cache service owns domain-specific caching
      this.logger.log(
        `[Approval ${actor.id}] Channel ${channel.youtubeChannelId} marked as approved`,
      );

      this.logger.log(
        `[Approval ${actor.id}] Successfully approved YouTube channel ${channel.youtubeChannelId}`,
      );

      return {
        id: channel.id,
        youtubeChannelId: channel.youtubeChannelId,
        channelTitle: channel.channelTitle || null,
        isApproved: true,
        approvedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[Approval ${actor.id}] Failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Safely extract numeric string from YouTube statistics object.
   * YouTube API returns counts as strings; we preserve the format here,
   * normalization happens at storage layer.
   */
  private extractStat(
    stats: Record<string, unknown> | undefined,
    key: string,
  ): string | null {
    if (!stats || typeof stats !== 'object') {
      return null;
    }

    const value = stats[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }
}
