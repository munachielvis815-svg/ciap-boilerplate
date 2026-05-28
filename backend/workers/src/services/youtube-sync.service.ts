import { OAuth2Client } from 'google-auth-library';
import { UnrecoverableError } from 'bullmq';
import type {
  NewContentItem,
  NewContentMetric,
  NewYoutubeAudienceDemographic,
  NewYoutubeChannel,
  NewYoutubeDailyAnalytics,
  NewYoutubeVideo,
  NewYoutubeVideoComment,
  OauthAccount,
} from '@shared/database/drizzle/schema';
import { StructuredLogger } from '@shared/logging/structured-logger';
import { SharedYoutubeNormalizationService } from '@shared/youtube/youtube-normalization';
import type { WorkerEnv } from '../config/worker-env';
import { WorkerYoutubeRepository } from '../repositories/worker-youtube.repository';

type YoutubeChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type YoutubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
  }>;
};

type YoutubeVideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
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

type YoutubeCommentThreadResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      topLevelComment?: {
        id?: string;
        snippet?: {
          textDisplay?: string;
          textOriginal?: string;
          authorDisplayName?: string;
          authorChannelId?: { value?: string };
          likeCount?: number;
          publishedAt?: string;
          updatedAt?: string;
        };
      };
    };
  }>;
};

type YoutubeAnalyticsRow = [string, ...number[]];

type YoutubeAnalyticsResponse = {
  rows?: YoutubeAnalyticsRow[];
};

type YoutubeDemographics = {
  ageGroups: Array<{ ageGroup: string; viewerPercentage: number }>;
  genders: Array<{ gender: string; viewerPercentage: number }>;
  countries: Array<{ country: string; viewerPercentage: number }>;
  startDate: string;
  endDate: string;
};

type YoutubeSyncResult = {
  youtubeChannelId: string;
  videosCount: number;
  analyticsCount: number;
  commentsCount: number;
  demographicsCount: number;
  metricsCount: number;
};

export class WorkerYoutubeSyncService {
  private readonly logger = new StructuredLogger('WorkerYoutubeSyncService');
  private readonly normalization = new SharedYoutubeNormalizationService();

  constructor(
    private readonly repository: WorkerYoutubeRepository,
    private readonly env: WorkerEnv,
  ) {}

  async syncUser(
    userId: number,
    tenantId: number,
    requestId: string,
    jobId: string,
  ): Promise<YoutubeSyncResult> {
    const staleBefore = new Date(
      Date.now() - this.env.youtubeSyncStaleAfterMinutes * 60_000,
    );
    const lastSyncedAt = await this.repository.getLatestChannelSyncAt(userId);
    if (lastSyncedAt && lastSyncedAt > staleBefore) {
      this.logger.info({
        message: 'Skipping YouTube sync; channel already up to date',
        requestId,
        jobId,
        userId,
        data: {
          tenantId,
          lastSyncedAt: lastSyncedAt.toISOString(),
        },
      });

      return {
        youtubeChannelId: 'skipped',
        videosCount: 0,
        analyticsCount: 0,
        commentsCount: 0,
        demographicsCount: 0,
        metricsCount: 0,
      };
    }

    const user = await this.repository.findUserById(userId);
    if (!user || user.tenantId !== tenantId) {
      throw new Error('worker-sync-user-not-found');
    }

    const oauthAccount =
      await this.repository.findYoutubeOauthAccountByUserId(userId);
    if (!oauthAccount) {
      throw new Error('worker-sync-oauth-account-not-found');
    }

    this.logger.info({
      message: 'Starting YouTube sync',
      requestId,
      jobId,
      userId,
      data: { tenantId },
    });

    const channelResponse =
      await this.fetchGoogleJsonWithRefresh<YoutubeChannelResponse>(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
        oauthAccount,
      );
    const channel = channelResponse.items?.[0] ?? null;
    if (!channel?.id) {
      throw new Error('worker-sync-youtube-channel-not-found');
    }

    const maxVideos = 10;
    const searchResponse =
      await this.fetchGoogleJsonWithRefresh<YoutubeSearchResponse>(
        `https://www.googleapis.com/youtube/v3/search?part=id&forMine=true&type=video&order=date&maxResults=${maxVideos}`,
        oauthAccount,
      );

    const videoIds = (searchResponse.items || [])
      .map((item) => item.id?.videoId)
      .filter((value): value is string => Boolean(value));

    const videosResponse = videoIds.length
      ? await this.fetchGoogleJsonWithRefresh<YoutubeVideosResponse>(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
          oauthAccount,
        )
      : { items: [] };

    const comments = videoIds.length
      ? await this.fetchVideoComments(videoIds, videosResponse, oauthAccount)
      : [];

    const analytics = await this.fetchAnalyticsReport(oauthAccount);
    const demographics = await this.fetchAudienceDemographics(oauthAccount);

    const normalizedChannel = this.normalization.normalizeChannel(
      channel.id,
      channel,
      userId,
    );
    if (!normalizedChannel) {
      throw new Error('worker-sync-normalized-channel-empty');
    }

    const persistedChannel = await this.repository.upsertChannel(
      normalizedChannel as NewYoutubeChannel,
    );
    const normalizedVideos = this.normalization.normalizeVideos(
      (videosResponse.items || []).map((video) => ({
        id: video.id,
        snippet: video.snippet,
        title: video.snippet?.title ?? null,
        description: video.snippet?.description ?? null,
        publishedAt: video.snippet?.publishedAt ?? null,
        statistics: video.statistics,
        contentDetails: video.contentDetails,
      })),
    );
    const persistedVideos = await this.repository.upsertVideos(
      normalizedVideos.map(
        (video) =>
          ({
            ...video,
            channelId: persistedChannel.id,
          }) satisfies NewYoutubeVideo,
      ),
    );
    const persistedAnalytics = await this.repository.upsertDailyAnalytics(
      this.normalization
        .normalizeDailyAnalytics(analytics.rows || [])
        .map(
          (entry) =>
            ({
              ...entry,
              channelId: persistedChannel.id,
            }) satisfies NewYoutubeDailyAnalytics,
        ),
    );

    const commentsCount = await this.persistVideoComments(
      comments,
      persistedVideos,
    );
    const demographicsCount = await this.persistAudienceDemographics(
      persistedChannel.id,
      demographics,
    );

    const persistedContentItems = await this.repository.upsertContentItems(
      normalizedVideos.map(
        (video) =>
          ({
            userId,
            platform: 'youtube',
            externalId: video.youtubeVideoId,
            title: video.videoTitle,
            description: video.videoDescription,
            url: `https://www.youtube.com/watch?v=${video.youtubeVideoId}`,
            thumbnailUrl: null,
            publishedAt: video.publishedAt,
            durationSeconds: video.durationSeconds,
          }) satisfies NewContentItem,
      ),
    );

    const metrics = this.buildContentMetricsFromAnalytics(
      userId,
      analytics.rows || [],
    );
    await this.repository.replaceMetrics(metrics);

    const result = {
      youtubeChannelId: persistedChannel.youtubeChannelId,
      videosCount: persistedVideos.length,
      analyticsCount: persistedAnalytics.length,
      commentsCount,
      demographicsCount,
      metricsCount: metrics.length,
    };

    this.logger.info({
      message: 'Completed YouTube sync',
      requestId,
      jobId,
      userId,
      data: result,
    });

    return result;
  }

  private async persistVideoComments(
    comments: YoutubeCommentsByVideo[],
    persistedVideos: Array<{ id: number; youtubeVideoId: string }>,
  ): Promise<number> {
    const videoMap = new Map(
      persistedVideos.map((video) => [video.youtubeVideoId, video.id]),
    );
    const rows: NewYoutubeVideoComment[] = comments.flatMap((entry) => {
      const videoId = videoMap.get(entry.videoId);
      if (!videoId) {
        return [];
      }

      const uniqueComments = this.dedupeComments([
        ...entry.topComments,
        ...entry.latestComments,
      ]);

      return uniqueComments.map(
        (comment) =>
          ({
            videoId,
            youtubeCommentId: comment.commentId,
            commentType: comment.commentType,
            authorDisplayName: comment.authorDisplayName,
            authorChannelId: comment.authorChannelId,
            textDisplay: comment.textDisplay,
            textOriginal: comment.textOriginal,
            likeCount: comment.likeCount,
            publishedAt: comment.publishedAt
              ? new Date(comment.publishedAt)
              : null,
            updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : null,
          }) satisfies NewYoutubeVideoComment,
      );
    });

    const saved = await this.repository.upsertVideoComments(rows);
    return saved.length;
  }

  private async persistAudienceDemographics(
    channelId: number,
    demographics: YoutubeDemographics,
  ): Promise<number> {
    const startDate = new Date(demographics.startDate);
    const endDate = new Date(demographics.endDate);
    const rows: NewYoutubeAudienceDemographic[] = [
      ...demographics.ageGroups.map(
        (entry) =>
          ({
            channelId,
            dimensionType: 'ageGroup',
            dimensionValue: entry.ageGroup,
            viewerPercentage: entry.viewerPercentage,
            startDate,
            endDate,
          }) satisfies NewYoutubeAudienceDemographic,
      ),
      ...demographics.genders.map(
        (entry) =>
          ({
            channelId,
            dimensionType: 'gender',
            dimensionValue: entry.gender,
            viewerPercentage: entry.viewerPercentage,
            startDate,
            endDate,
          }) satisfies NewYoutubeAudienceDemographic,
      ),
      ...demographics.countries.map(
        (entry) =>
          ({
            channelId,
            dimensionType: 'country',
            dimensionValue: entry.country,
            viewerPercentage: entry.viewerPercentage,
            startDate,
            endDate,
          }) satisfies NewYoutubeAudienceDemographic,
      ),
    ];

    const saved = await this.repository.upsertAudienceDemographics(rows);
    return saved.length;
  }

  private buildContentMetricsFromAnalytics(
    userId: number,
    rows: YoutubeAnalyticsRow[],
  ): NewContentMetric[] {
    const metricNames = [
      'views',
      'estimatedMinutesWatched',
      'averageViewDuration',
      'subscribersGained',
      'subscribersLost',
      'likes',
      'comments',
      'shares',
    ] as const;

    const metrics: NewContentMetric[] = [];
    for (const row of rows) {
      const periodDate = row[0] ? new Date(row[0]) : null;
      for (let index = 0; index < metricNames.length; index += 1) {
        const value = row[index + 1];
        if (typeof value !== 'number') {
          continue;
        }

        metrics.push({
          userId,
          contentItemId: null,
          platform: 'youtube',
          metricName: metricNames[index],
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

  private async fetchAnalyticsReport(
    oauthAccount: OauthAccount,
  ): Promise<YoutubeAnalyticsResponse> {
    const { start, end } = this.resolveAnalyticsWindow(30);
    const query = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics:
        'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares',
      dimensions: 'day',
      sort: 'day',
      maxResults: '90',
    });

    return this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
      `https://youtubeanalytics.googleapis.com/v2/reports?${query.toString()}`,
      oauthAccount,
    );
  }

  private async fetchAudienceDemographics(
    oauthAccount: OauthAccount,
  ): Promise<YoutubeDemographics> {
    const { start, end } = this.resolveAnalyticsWindow(30);
    const [ageResponse, genderResponse, countryResponse] = await Promise.all([
      this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
        `https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({
          ids: 'channel==MINE',
          startDate: start,
          endDate: end,
          metrics: 'viewerPercentage',
          dimensions: 'ageGroup',
        }).toString()}`,
        oauthAccount,
      ).catch(() => ({ rows: [] })),
      this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
        `https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({
          ids: 'channel==MINE',
          startDate: start,
          endDate: end,
          metrics: 'viewerPercentage',
          dimensions: 'gender',
        }).toString()}`,
        oauthAccount,
      ).catch(() => ({ rows: [] })),
      this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
        `https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({
          ids: 'channel==MINE',
          startDate: start,
          endDate: end,
          metrics: 'views',
          dimensions: 'country',
          sort: '-views',
          maxResults: '25',
        }).toString()}`,
        oauthAccount,
      ).catch(() => ({ rows: [] })),
    ]);

    return {
      ageGroups: this.mapAgeGroupRows(ageResponse.rows),
      genders: this.mapGenderRows(genderResponse.rows),
      countries: this.mapCountryRows(countryResponse.rows),
      startDate: start,
      endDate: end,
    };
  }

  private mapAgeGroupRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ ageGroup: string; viewerPercentage: number }> {
    return (rows || [])
      .map((row) => {
        if (typeof row[0] !== 'string' || typeof row[1] !== 'number') {
          return null;
        }

        return { ageGroup: row[0], viewerPercentage: row[1] };
      })
      .filter(
        (
          value,
        ): value is { ageGroup: string; viewerPercentage: number } =>
          value != null,
      );
  }

  private mapGenderRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ gender: string; viewerPercentage: number }> {
    return (rows || [])
      .map((row) => {
        if (typeof row[0] !== 'string' || typeof row[1] !== 'number') {
          return null;
        }

        return { gender: row[0], viewerPercentage: row[1] };
      })
      .filter(
        (value): value is { gender: string; viewerPercentage: number } =>
          value != null,
      );
  }

  private mapCountryRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ country: string; viewerPercentage: number }> {
    const mapped = (rows || [])
      .map((row) => {
        if (typeof row[0] !== 'string' || typeof row[1] !== 'number') {
          return null;
        }

        return { country: row[0], views: row[1] };
      })
      .filter((value): value is { country: string; views: number } => value != null);
    const totalViews = mapped.reduce((sum, row) => sum + row.views, 0);

    return mapped.map((row) => ({
      country: row.country,
      viewerPercentage: totalViews > 0 ? row.views / totalViews : 0,
    }));
  }

  private async fetchVideoComments(
    videoIds: string[],
    videosResponse: YoutubeVideosResponse,
    oauthAccount: OauthAccount,
  ): Promise<YoutubeCommentsByVideo[]> {
    const videoCommentCounts = new Map<string, number>();
    for (const video of videosResponse.items || []) {
      if (!video.id) {
        continue;
      }

      videoCommentCounts.set(video.id, Number(video.statistics?.commentCount ?? 0));
    }

    return Promise.all(
      videoIds.map(async (videoId) => {
        const [topComments, latestComments] = await Promise.all([
          this.fetchCommentThreads(oauthAccount, videoId, 'relevance', 20, 'top'),
          this.fetchCommentThreads(oauthAccount, videoId, 'time', 50, 'latest'),
        ]);
        const uniqueComments = this.dedupeComments([
          ...topComments,
          ...latestComments,
        ]);

        return {
          videoId,
          commentCount: videoCommentCounts.get(videoId) ?? 0,
          topComments,
          latestComments,
          sampleComments: uniqueComments.slice(0, 5),
        };
      }),
    );
  }

  private async fetchCommentThreads(
    oauthAccount: OauthAccount,
    videoId: string,
    order: 'relevance' | 'time',
    maxResults: number,
    commentType: 'top' | 'latest',
  ): Promise<YoutubeComment[]> {
    const query = new URLSearchParams({
      part: 'snippet',
      videoId,
      order,
      maxResults: String(maxResults),
    });

    try {
      const response =
        await this.fetchGoogleJsonWithRefresh<YoutubeCommentThreadResponse>(
          `https://www.googleapis.com/youtube/v3/commentThreads?${query.toString()}`,
          oauthAccount,
        );

      return (response.items || [])
        .map((item) => {
          const snippet = item.snippet?.topLevelComment?.snippet;
          const commentId = item.snippet?.topLevelComment?.id || item.id || '';
          if (!snippet || !commentId) {
            return null;
          }

          return {
            commentId,
            textDisplay: snippet.textDisplay ?? null,
            textOriginal: snippet.textOriginal ?? null,
            authorDisplayName: snippet.authorDisplayName ?? null,
            authorChannelId: snippet.authorChannelId?.value ?? null,
            likeCount:
              typeof snippet.likeCount === 'number' ? snippet.likeCount : 0,
            publishedAt: snippet.publishedAt ?? null,
            updatedAt: snippet.updatedAt ?? null,
            commentType,
          } satisfies YoutubeComment;
        })
        .filter((value): value is YoutubeComment => value != null);
    } catch {
      return [];
    }
  }

  private dedupeComments(comments: YoutubeComment[]): YoutubeComment[] {
    const seen = new Set<string>();
    const unique: YoutubeComment[] = [];

    for (const comment of comments) {
      if (seen.has(comment.commentId)) {
        continue;
      }

      seen.add(comment.commentId);
      unique.push(comment);
    }

    return unique;
  }

  private resolveAnalyticsWindow(days: number): {
    start: string;
    end: string;
  } {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));

    return {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };
  }

  private async fetchGoogleJsonWithRefresh<T>(
    url: string,
    oauthAccount: OauthAccount,
  ): Promise<T> {
    const accessToken = await this.resolveAccessToken(oauthAccount);

    try {
      return await this.fetchGoogleJson<T>(url, accessToken);
    } catch (error) {
      if (this.isUnauthorizedError(error)) {
        const refreshed = await this.refreshGoogleAccessToken(oauthAccount);
        return this.fetchGoogleJson<T>(url, refreshed);
      }

      throw error;
    }
  }

  private async resolveAccessToken(oauthAccount: OauthAccount): Promise<string> {
    if (
      oauthAccount.accessToken &&
      (!oauthAccount.tokenExpiresAt ||
        oauthAccount.tokenExpiresAt.getTime() - Date.now() > 30_000)
    ) {
      return oauthAccount.accessToken;
    }

    return this.refreshGoogleAccessToken(oauthAccount);
  }

  private async refreshGoogleAccessToken(
    oauthAccount: OauthAccount,
  ): Promise<string> {
    if (!oauthAccount.refreshToken) {
      throw new Error('worker-sync-missing-refresh-token');
    }

    const client = new OAuth2Client(
      this.env.googleClientId,
      this.env.googleClientSecret,
    );
    client.setCredentials({
      refresh_token: oauthAccount.refreshToken,
    });

    let credentials: typeof client.credentials;
    try {
      ({ credentials } = await client.refreshAccessToken());
    } catch (error) {
      if (this.isInvalidGrantError(error)) {
        const hasUsableAccessToken =
          Boolean(oauthAccount.accessToken) &&
          (!oauthAccount.tokenExpiresAt ||
            oauthAccount.tokenExpiresAt.getTime() - Date.now() > 30_000);

        if (hasUsableAccessToken) {
          this.logger.warn({
            message: 'Google refresh token revoked; using existing access token',
            data: {
              userId: oauthAccount.userId,
              oauthAccountId: oauthAccount.id,
            },
          });

          await this.repository.updateOauthAccountTokens(oauthAccount.id, {
            accessToken: oauthAccount.accessToken,
            refreshToken: null,
            tokenExpiresAt: oauthAccount.tokenExpiresAt,
            email: oauthAccount.email,
          });

          return oauthAccount.accessToken as string;
        }

        throw new UnrecoverableError('worker-sync-oauth-reconnect-required');
      }

      throw error;
    }
    const accessToken = credentials.access_token ?? oauthAccount.accessToken;
    if (!accessToken) {
      throw new Error('worker-sync-missing-access-token');
    }

    await this.repository.updateOauthAccountTokens(oauthAccount.id, {
      accessToken,
      refreshToken: credentials.refresh_token ?? oauthAccount.refreshToken,
      tokenExpiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : oauthAccount.tokenExpiresAt,
      email: oauthAccount.email,
    });

    oauthAccount.accessToken = accessToken;
    oauthAccount.refreshToken =
      credentials.refresh_token ?? oauthAccount.refreshToken;
    oauthAccount.tokenExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : oauthAccount.tokenExpiresAt;

    return accessToken;
  }

  private async fetchGoogleJson<T>(
    url: string,
    accessToken: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.googleApiTimeoutMs,
    );

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          JSON.stringify({
            status: response.status,
            body,
          }),
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isUnauthorizedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.includes('"status":401');
  }

  private isInvalidGrantError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    if (error.message.includes('invalid_grant')) {
      return true;
    }

    const response = (error as Error & {
      response?: { data?: unknown };
    }).response;
    const responseData = response?.data;
    if (!responseData || typeof responseData !== 'object') {
      return false;
    }

    return Object.values(responseData).some(
      (value) => typeof value === 'string' && value.includes('invalid_grant'),
    );
  }
}
