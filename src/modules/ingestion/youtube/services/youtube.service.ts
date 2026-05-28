import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ValidationException,
  YoutubeChannelNotFoundException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';
import type { YoutubeMetricsQueryDto } from '@modules/auth/socials/dto/youtube-metrics-query.dto';
import { SocialsService } from '@modules/auth/socials/services/socials.service';
import { YoutubeNormalizationService } from './youtube-normalization.service';
import { YoutubeRepository } from '../repository/youtube.repository';
import { YoutubeCacheService } from './youtube-cache.service';
import { QueueService } from '@modules/queue/queue.service';
import { HealthService } from '@modules/health/health.service';
import type { ApproveYoutubeChannelDto } from '../dto/approve-youtube-channel.dto';
import { ContentRepository } from '../repository/content.repository';
import type {
  NewContentItem,
  NewContentMetric,
  NewYoutubeAudienceDemographic,
  NewYoutubeVideoComment,
  YoutubeAudienceDemographic,
  YoutubeVideoComment,
  YoutubeVideo as YoutubeVideoRecord,
} from '@database/drizzle/schema';

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
type YoutubeAnalyticsRow = [string, ...number[]];
type YoutubeAnalytics = {
  columnHeaders?: Array<{
    name?: string;
    columnType?: string;
    dataType?: string;
  }>;
  rows?: YoutubeAnalyticsRow[];
};

type YoutubeDemographics = {
  ageGroups: Array<{ ageGroup: string; viewerPercentage: number }>;
  genders: Array<{ gender: string; viewerPercentage: number }>;
  countries: Array<{ country: string; viewerPercentage: number }>;
  startDate: string;
  endDate: string;
};

type YoutubeComment = {
  commentId: string;
  textDisplay: string | null;
  textOriginal: string | null;
  authorDisplayName: string | null;
  authorChannelId: string | null;
  likeCount: number;
  publishedAt: string | null;
  updatedAt: string | null;
  commentType: 'top' | 'latest';
};

type YoutubeCommentsByVideo = {
  videoId: string;
  commentCount: number;
  topComments: YoutubeComment[];
  latestComments: YoutubeComment[];
  sampleComments: YoutubeComment[];
};

type CacheStatus = 'success' | 'warning' | 'error';
type JobStatus = 'queued' | 'warning' | 'error';

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
  comments: YoutubeCommentsByVideo[];
  demographics: YoutubeDemographics | null;
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
    private readonly contentRepository: ContentRepository,
    private readonly cache: YoutubeCacheService,
    private readonly queueService: QueueService,
    private readonly healthService: HealthService,
  ) {}

  prepareYoutubeOauth(actor: RequestUser) {
    return this.socialsService.prepareGoogleOauth2Youtube(actor);
  }

  async connectYoutubeOauth(
    code: string,
    state: string,
    query: YoutubeMetricsQueryDto,
  ) {
    const actor =
      await this.socialsService.connectGoogleYoutubeAuthorizationCode(
        code,
        state,
      );

    return this.getYoutubeMetrics(actor, query);
  }

  /**
   * Full orchestration pipeline for YouTube metrics ingestion.
   * Flow: Fetch → Normalize → Persist → Queue
   *
   * Queue failures are logged but don't fail the sync;
   * data is already persisted to DB.
   */
  async getYoutubeMetrics(
    actor: RequestUser,
    query: YoutubeMetricsQueryDto,
  ): Promise<{
    channel: YoutubeChannel | null;
    videos: YoutubeVideo[];
    videosCount: number;
    comments: YoutubeCommentsByVideo[];
    demographics: YoutubeDemographics | null;
    analyticsCount: number;
    analyticsStatus: 'success' | 'warning';
    analyticsWarning: string | null;
    ingestionStatus: 'success' | 'warning';
    ingestionWarning: string | null;
    cacheStatus: CacheStatus;
    jobId: string | null;
    jobStatus: JobStatus;
    syncedAt: string;
    contentItemsCount: number;
    metricsCount: number;
    commentsCount: number;
    demographicsCount: number;
  }> {
    const syncStartTime = Date.now();

    try {
      this.logger.log(
        `[Sync ${actor.id}] Starting YouTube metrics sync for user ${actor.id}, tenant ${actor.tenantId}`,
      );

      // 1. FETCH: Get raw data from YouTube API
      let raw: Awaited<ReturnType<SocialsService['getYoutubeMetrics']>>;
      try {
        raw = await this.socialsService.getYoutubeMetrics(actor, query);
      } catch (error) {
        if (error instanceof YoutubeChannelNotFoundException) {
          return {
            channel: null,
            videos: [],
            videosCount: 0,
            comments: [],
            demographics: null,
            analyticsCount: 0,
            analyticsStatus: 'warning',
            analyticsWarning: null,
            ingestionStatus: 'warning',
            ingestionWarning:
              'No YouTube channel found for this account. Connect a channel before ingestion can run.',
            cacheStatus: 'warning',
            jobId: null,
            jobStatus: 'warning',
            syncedAt: new Date().toISOString(),
            contentItemsCount: 0,
            metricsCount: 0,
            commentsCount: 0,
            demographicsCount: 0,
          };
        }

        if (error instanceof ValidationException) {
          return {
            channel: null,
            videos: [],
            videosCount: 0,
            comments: [],
            demographics: null,
            analyticsCount: 0,
            analyticsStatus: 'warning',
            analyticsWarning: null,
            ingestionStatus: 'warning',
            ingestionWarning:
              'YouTube channel ID is missing. Reconnect Google OAuth to continue.',
            cacheStatus: 'warning',
            jobId: null,
            jobStatus: 'warning',
            syncedAt: new Date().toISOString(),
            contentItemsCount: 0,
            metricsCount: 0,
            commentsCount: 0,
            demographicsCount: 0,
          };
        }

        throw error;
      }

      if (!raw.channel) {
        return {
          channel: null,
          videos: [],
          videosCount: 0,
          comments: [],
          demographics: null,
          analyticsCount: 0,
          analyticsStatus: 'warning',
          analyticsWarning: null,
          ingestionStatus: 'warning',
          ingestionWarning:
            'No YouTube channel found for this account. Connect a channel before ingestion can run.',
          cacheStatus: 'warning',
          jobId: null,
          jobStatus: 'warning',
          syncedAt: new Date().toISOString(),
          contentItemsCount: 0,
          metricsCount: 0,
          commentsCount: 0,
          demographicsCount: 0,
        };
      }

      if (!raw.channel.id) {
        return {
          channel: null,
          videos: [],
          videosCount: 0,
          comments: [],
          demographics: null,
          analyticsCount: 0,
          analyticsStatus: 'warning',
          analyticsWarning: null,
          ingestionStatus: 'warning',
          ingestionWarning:
            'YouTube channel ID is missing. Reconnect Google OAuth to continue.',
          cacheStatus: 'warning',
          jobId: null,
          jobStatus: 'warning',
          syncedAt: new Date().toISOString(),
          contentItemsCount: 0,
          metricsCount: 0,
          commentsCount: 0,
          demographicsCount: 0,
        };
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

      const {
        persisted,
        contentItemsCount,
        metricsCount,
        commentsCount,
        demographicsCount,
      } = await this.persistNormalizedData(actor, normalized, raw);

      this.logger.log(
        `[Sync ${actor.id}] Persisted to DB: channel ${persisted.channel.youtubeChannelId}, ${persisted.videos.length} videos, ${persisted.analytics.length} analytics`,
      );

      const cacheStatus: CacheStatus = 'warning';
      const { jobId, jobStatus } = await this.enqueueIngestionJobs(
        actor,
        query,
        persisted,
        raw,
        {
          contentItemsCount,
          metricsCount,
          commentsCount,
          demographicsCount,
        },
      );

      const syncTimeMs = Date.now() - syncStartTime;

      this.logger.log(
        `[Sync ${actor.id}] Completed in ${syncTimeMs}ms | Cache: ${cacheStatus} | Job: ${jobStatus}`,
      );

      // 7. RETURN: Summary response for client
      return {
        channel: persisted.channel as unknown as YoutubeChannel,
        videos: persisted.videos as unknown as YoutubeVideo[],
        videosCount: persisted.videos.length,
        commentsCount,
        demographicsCount,
        comments:
          raw.comments?.map((comment) => ({
            ...comment,
            topComments: [],
            latestComments: [],
          })) ?? [],
        demographics: raw.demographics ?? null,
        analyticsCount: persisted.analytics.length,
        analyticsStatus: raw.analyticsStatus ?? 'success',
        analyticsWarning: raw.analyticsWarning ?? null,
        ingestionStatus: 'success',
        ingestionWarning: null,
        cacheStatus,
        jobId,
        jobStatus,
        syncedAt: new Date().toISOString(),
        contentItemsCount,
        metricsCount,
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

      const approved = await this.repository.approveChannel(channel.id);
      await this.cache.setChannelApproved(channel.youtubeChannelId);

      this.logger.log(
        `[Approval ${actor.id}] Channel ${channel.youtubeChannelId} marked as approved`,
      );

      this.logger.log(
        `[Approval ${actor.id}] Successfully approved YouTube channel ${channel.youtubeChannelId}`,
      );

      return {
        id: approved.id,
        youtubeChannelId: approved.youtubeChannelId,
        channelTitle: approved.channelTitle || null,
        isApproved: true,
        approvedAt: (approved.approvedAt ?? new Date()).toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[Approval ${actor.id}] Failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async approvePermissions(
    actor: RequestUser,
    dto: ApproveYoutubeChannelDto,
  ): Promise<{
    youtubeChannelId: string;
    permissionsApproved: boolean;
    approvedAt: string;
  }> {
    const channel = await this.repository.getChannelByYoutubeId(
      dto.youtubeChannelId,
    );

    if (!channel) {
      throw new NotFoundException(
        `YouTube channel ${dto.youtubeChannelId} not found; ensure metrics have been fetched first`,
      );
    }

    if (channel.userId !== actor.id) {
      throw new ForbiddenException(
        'YouTube channel does not belong to authenticated user',
      );
    }

    const approved = await this.repository.approveChannel(channel.id);
    await this.cache.setChannelApproved(channel.youtubeChannelId);

    return {
      youtubeChannelId: approved.youtubeChannelId,
      permissionsApproved: true,
      approvedAt: (approved.approvedAt ?? new Date()).toISOString(),
    };
  }

  private async persistNormalizedData(
    actor: RequestUser,
    normalized: {
      channel: ReturnType<YoutubeNormalizationService['normalizeChannel']>;
      videos: ReturnType<YoutubeNormalizationService['normalizeVideos']>;
      analytics: ReturnType<
        YoutubeNormalizationService['normalizeDailyAnalytics']
      >;
    },
    raw: {
      analytics: { rows?: YoutubeAnalyticsRow[] };
      comments?: YoutubeCommentsByVideo[];
      demographics?: YoutubeDemographics | null;
    },
  ) {
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

    const commentsCount = await this.persistVideoComments(
      persisted,
      raw.comments || [],
    );

    const demographicsCount = await this.persistAudienceDemographics(
      persistedChannel.id,
      raw.demographics,
    );

    const contentItems = this.mapVideosToContentItems(
      actor.id,
      normalized.videos,
    );
    const persistedContentItems =
      await this.contentRepository.upsertContentItems(contentItems);
    const normalizedMetrics = this.buildContentMetricsFromAnalytics(
      actor.id,
      raw.analytics.rows || [],
    );
    await this.contentRepository.insertMetrics(normalizedMetrics);

    return {
      persisted,
      contentItemsCount: persistedContentItems.length,
      metricsCount: normalizedMetrics.length,
      commentsCount,
      demographicsCount,
    };
  }

  private async enqueueIngestionJobs(
    actor: RequestUser,
    query: YoutubeMetricsQueryDto,
    persisted: {
      channel: {
        youtubeChannelId: string;
        channelTitle?: string | null;
        subscriberCount: number | null;
        totalViewCount: number | null;
        videoCount?: number | null;
      };
      videos: Array<{
        youtubeVideoId: string;
        videoTitle: string | null;
        viewCount: number | null;
        likeCount: number | null;
        commentCount: number | null;
        publishedAt: Date | null;
      }>;
      analytics: Array<unknown>;
    },
    raw: {
      comments?: YoutubeCommentsByVideo[];
      demographics?: YoutubeDemographics | null;
      analyticsStatus?: 'success' | 'warning';
      analyticsWarning?: string | null;
    },
    summary: {
      contentItemsCount: number;
      metricsCount: number;
      commentsCount: number;
      demographicsCount: number;
    },
  ): Promise<{ jobId: string | null; jobStatus: JobStatus }> {
    let jobId: string | null = null;
    let jobStatus: JobStatus = 'queued';

    try {
      const videos = persisted.videos.map((video) => {
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
      });

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
        raw.comments?.reduce((count, entry) => count + entry.commentCount, 0) ??
        0;

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
            cacheStatus: 'warning',
            syncedAt: new Date().toISOString(),
          },
          summary: {
            videosCount: persisted.videos.length,
            commentsCount: totalCommentsCount,
            demographicsCount: summary.demographicsCount,
            contentItemsCount: summary.contentItemsCount,
            metricsCount: summary.metricsCount,
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
          videos: videos.slice(0, query.maxVideos ?? 10),
        },
        'user-requested-sync',
      );
      this.logger.log(
        `[Sync ${actor.id}] Enqueued YouTube queue job ${jobId} for user ${actor.id}`,
      );
    } catch (queueError) {
      this.logger.error(
        `[Sync ${actor.id}] Failed to enqueue YouTube queue job (data persisted, scoring deferred): ${queueError instanceof Error ? queueError.message : String(queueError)}`,
      );
      jobStatus = 'warning';
    }

    return { jobId, jobStatus };
  }

  private async persistVideoComments(
    persisted: {
      videos: YoutubeVideoRecord[];
    },
    comments: YoutubeCommentsByVideo[],
  ): Promise<number> {
    if (!comments.length) {
      return 0;
    }

    const videoMap = new Map(
      persisted.videos.map((video) => [video.youtubeVideoId, video]),
    );
    const records: NewYoutubeVideoComment[] = comments.flatMap((entry) => {
      const video = videoMap.get(entry.videoId);
      if (!video) {
        return [];
      }

      const uniqueComments = this.dedupeCommentsById([
        ...entry.topComments,
        ...entry.latestComments,
      ]);
      return uniqueComments.map((comment) => ({
        videoId: video.id,
        youtubeCommentId: comment.commentId,
        commentType: comment.commentType,
        authorDisplayName: comment.authorDisplayName,
        authorChannelId: comment.authorChannelId,
        textDisplay: comment.textDisplay,
        textOriginal: comment.textOriginal,
        likeCount: comment.likeCount,
        publishedAt: comment.publishedAt ? new Date(comment.publishedAt) : null,
        updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : null,
      }));
    });

    if (!records.length) {
      return 0;
    }

    const saved: YoutubeVideoComment[] =
      await this.repository.upsertVideoComments(records);
    return saved.length;
  }

  private async persistAudienceDemographics(
    channelId: number,
    demographics: YoutubeDemographics | null | undefined,
  ): Promise<number> {
    if (!demographics) {
      return 0;
    }

    const startDate = new Date(demographics.startDate);
    const endDate = new Date(demographics.endDate);
    const records: NewYoutubeAudienceDemographic[] = [
      ...demographics.ageGroups.map((entry) => ({
        channelId,
        dimensionType: 'ageGroup',
        dimensionValue: entry.ageGroup,
        viewerPercentage: entry.viewerPercentage,
        startDate,
        endDate,
      })),
      ...demographics.genders.map((entry) => ({
        channelId,
        dimensionType: 'gender',
        dimensionValue: entry.gender,
        viewerPercentage: entry.viewerPercentage,
        startDate,
        endDate,
      })),
      ...demographics.countries.map((entry) => ({
        channelId,
        dimensionType: 'country',
        dimensionValue: entry.country,
        viewerPercentage: entry.viewerPercentage,
        startDate,
        endDate,
      })),
    ];

    if (!records.length) {
      return 0;
    }

    const saved: YoutubeAudienceDemographic[] =
      await this.repository.upsertAudienceDemographics(records);
    return saved.length;
  }

  private dedupeCommentsById(
    comments: Array<{
      commentId: string;
      commentType: 'top' | 'latest';
      authorDisplayName: string | null;
      authorChannelId: string | null;
      textDisplay: string | null;
      textOriginal: string | null;
      likeCount: number;
      publishedAt: string | null;
      updatedAt: string | null;
    }>,
  ) {
    const seen = new Set<string>();
    return comments.filter((comment) => {
      if (seen.has(comment.commentId)) {
        return false;
      }
      seen.add(comment.commentId);
      return true;
    });
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

  private mapVideosToContentItems(
    userId: number,
    videos: Array<{
      youtubeVideoId: string;
      videoTitle: string | null;
      videoDescription: string | null;
      publishedAt: Date | null;
      durationSeconds: number | null;
    }>,
  ): NewContentItem[] {
    return videos.map((video) => ({
      userId,
      platform: 'youtube',
      externalId: video.youtubeVideoId,
      title: video.videoTitle,
      description: video.videoDescription,
      url: `https://www.youtube.com/watch?v=${video.youtubeVideoId}`,
      thumbnailUrl: null,
      publishedAt: video.publishedAt ?? null,
      durationSeconds: video.durationSeconds ?? null,
    }));
  }

  private buildContentMetricsFromAnalytics(
    userId: number,
    rows: YoutubeAnalyticsRow[],
  ): NewContentMetric[] {
    const metrics: NewContentMetric[] = [];

    for (const row of rows) {
      const dateStr = row[0];
      const periodDate = dateStr ? new Date(dateStr) : null;
      const metricNames = [
        'views',
        'estimatedMinutesWatched',
        'averageViewDuration',
        'subscribersGained',
        'subscribersLost',
        'likes',
        'comments',
        'shares',
        'impressions',
        'impressionsClickThroughRate',
      ];

      for (let i = 0; i < metricNames.length; i += 1) {
        const value = row[i + 1];
        if (typeof value !== 'number') {
          continue;
        }

        metrics.push({
          userId,
          contentItemId: null,
          platform: 'youtube',
          metricName: metricNames[i],
          metricValue: value,
          metricUnit: null,
          periodStart: periodDate,
          periodEnd: periodDate,
          recordedAt: new Date(),
        });
      }
    }

    return metrics;
  }
}
