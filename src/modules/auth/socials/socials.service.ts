import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AuthService } from '@modules/auth/auth.service';
import { GOOGLE_YOUTUBE_CONNECT_SCOPES } from '@modules/auth/auth-google-oauth.service';
import { UsersRepository } from '@modules/users/users.repository';
import {
  ExternalApiException,
  InsufficientPermissionsException,
  InvalidTokenException,
  ValidationException,
  YoutubeChannelNotFoundException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';
import type { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import type { GoogleAuthDto } from '@modules/auth/dto/google-auth.dto';
import type { YoutubeMetricsQueryDto } from './dto/youtube-metrics-query.dto';
import {
  buildYoutubeMetricsPullJobPayload,
  YOUTUBE_PULL_JOB,
  YOUTUBE_QUEUE,
} from './youtube-metrics.job';

type YoutubeChannelResponse = {
  items?: Array<{
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
  }>;
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

type YoutubeAnalyticsRow = [string, ...number[]]; // date + metrics
type YoutubeAnalyticsResponse = {
  columnHeaders?: Array<{
    name?: string;
    columnType?: string;
    dataType?: string;
  }>;
  rows?: YoutubeAnalyticsRow[];
};

type YoutubeDemographicsResponse = {
  ageGroups: Array<{ ageGroup: string; viewerPercentage: number }>;
  genders: Array<{ gender: string; viewerPercentage: number }>;
  countries: Array<{ country: string; viewerPercentage: number }>;
  startDate: string;
  endDate: string;
};

type YoutubeDemographicsFetchResult = {
  demographics: YoutubeDemographicsResponse;
  warning: string | null;
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

@Injectable()
export class SocialsService {
  private readonly logger = new Logger(SocialsService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async loginWithGoogle(
    dto: GoogleAuthDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(dto, request);
  }

  async loginWithGoogleAuthorizationCode(
    code: string,
    request: Request,
    state?: string,
  ): Promise<AuthResponseDto> {
    const role = this.resolveLoginRole(state);
    return this.authService.loginWithGoogleAuthorizationCode(
      code,
      request,
      role,
    );
  }

  prepareGoogleOauth2Login(role?: 'sme' | 'creator') {
    return this.authService.prepareGoogleOauth('google', {
      purpose: 'login',
      role,
    });
  }

  prepareGoogleOauth2Youtube(actor: RequestUser) {
    return this.authService.prepareGoogleOauth('google', {
      purpose: 'youtube-connect',
      actor,
    });
  }

  async connectGoogleYoutubeAuthorizationCode(
    code: string,
    state: string,
  ): Promise<RequestUser> {
    const oauthState = this.authService.parseOauthState(state);

    if (oauthState.purpose !== 'youtube-connect') {
      throw new InvalidTokenException({ reason: 'invalid-oauth-purpose' });
    }

    const userId = Number(oauthState.sub || 0);
    const tenantId = Number(oauthState.tenantId || 0);
    if (!userId || !tenantId) {
      throw new InvalidTokenException({ reason: 'invalid-oauth-state' });
    }

    const user = await this.usersRepository.findByIdOrNull(userId);
    if (user?.tenantId !== tenantId) {
      throw new InvalidTokenException({ reason: 'oauth-user-not-found' });
    }

    await this.authService.connectGoogleYoutubeAuthorizationCode(code, {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sessionId: 'oauth-connect',
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sessionId: 'oauth-connect',
    };
  }

  async refreshGoogleOauthTokens(
    actor: RequestUser,
  ): Promise<{ tokenExpiresAt: Date | null }> {
    const refreshed = await this.authService.refreshGoogleOauthTokensForUser(
      actor.id,
      actor,
    );
    return {
      tokenExpiresAt: refreshed.tokenExpiresAt,
    };
  }

  async getYoutubeMetrics(actor: RequestUser, query: YoutubeMetricsQueryDto) {
    const days = query.days ?? 30;
    const maxVideos = Math.min(query.maxVideos ?? 10, 10);

    let channel: YoutubeChannelResponse;
    let channelItem:
      | NonNullable<YoutubeChannelResponse['items']>[number]
      | null;
    let videos: YoutubeVideosResponse;
    let comments: YoutubeCommentsByVideo[] = [];
    let demographics: YoutubeDemographicsResponse | null = null;
    let demographicsStatus: 'success' | 'warning' = 'success';
    let demographicsWarning: string | null = null;

    try {
      channel = await this.fetchGoogleJsonWithRefresh<YoutubeChannelResponse>(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
        actor,
      );
      channelItem = channel.items?.[0] ?? null;
      if (!channelItem) {
        throw new YoutubeChannelNotFoundException({ reason: 'no-channel' });
      }
      if (!channelItem.id) {
        throw new ValidationException(
          'YouTube channel ID is missing; reconnect Google OAuth.',
          { reason: 'missing-channel-id' },
        );
      }

      const searchResult =
        await this.fetchGoogleJsonWithRefresh<YoutubeSearchResponse>(
          `https://www.googleapis.com/youtube/v3/search?part=id&forMine=true&type=video&order=date&maxResults=${maxVideos}`,
          actor,
        );

      const videoIds = (searchResult.items || [])
        .map((item) => item.id?.videoId)
        .filter((value): value is string => Boolean(value));

      videos = videoIds.length
        ? await this.fetchGoogleJsonWithRefresh<YoutubeVideosResponse>(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
            actor,
          )
        : { items: [] };

      if (videoIds.length) {
        comments = await this.fetchVideoComments(actor, videoIds, videos);
      }
    } catch (error) {
      if (
        error instanceof InsufficientPermissionsException &&
        this.isGoogleScopeInsufficientError(error)
      ) {
        throw this.buildGoogleOauthRequiredException(
          'insufficient-youtube-scopes',
          actor,
          {
            requiredScopes: [...GOOGLE_YOUTUBE_CONNECT_SCOPES],
            ...error.details,
          },
        );
      }

      throw error;
    }

    let analytics = { columnHeaders: [], rows: [] } as YoutubeAnalyticsResponse;
    let analyticsStatus: 'success' | 'warning' = 'success';
    let analyticsWarning: string | null = null;

    try {
      analytics = await this.fetchAnalyticsReport(actor, days);
    } catch (error) {
      if (error instanceof InsufficientPermissionsException) {
        analyticsStatus = 'warning';
        analyticsWarning =
          'YouTube Analytics data is unavailable for this account. Channel analytics access may be missing.';
      } else {
        throw error;
      }
    }

    try {
      const demographicsResult = await this.fetchAudienceDemographics(
        actor,
        days,
      );
      demographics = demographicsResult.demographics;
      if (demographicsResult.warning) {
        demographicsStatus = 'warning';
        demographicsWarning = demographicsResult.warning;
      }
    } catch (error) {
      if (error instanceof InsufficientPermissionsException) {
        demographicsStatus = 'warning';
        demographicsWarning =
          'YouTube audience demographics are unavailable for this account.';
      } else {
        throw error;
      }
    }

    return {
      channel: channelItem,
      videos: videos.items || [],
      comments,
      demographics,
      analytics,
      analyticsStatus,
      analyticsWarning,
      demographicsStatus,
      demographicsWarning,
      limits: {
        days,
        maxVideos,
      },
      // Prepared payload contract for later BullMQ integration.
      bullmq: {
        queue: YOUTUBE_QUEUE,
        jobName: YOUTUBE_PULL_JOB,
        payload: buildYoutubeMetricsPullJobPayload({
          userId: actor.id,
          tenantId: actor.tenantId,
          days,
          maxVideos,
        }),
      },
    };
  }

  getYoutubeMetricsJobPayload(
    actor: RequestUser,
    query: YoutubeMetricsQueryDto,
  ) {
    const days = query.days ?? 30;
    const maxVideos = Math.min(query.maxVideos ?? 10, 10);

    return {
      queue: YOUTUBE_QUEUE,
      jobName: YOUTUBE_PULL_JOB,
      payload: buildYoutubeMetricsPullJobPayload({
        userId: actor.id,
        tenantId: actor.tenantId,
        days,
        maxVideos,
      }),
    };
  }

  private async resolveGoogleAccessToken(actor: RequestUser): Promise<string> {
    const oauthAccount =
      await this.authRepository.findOauthAccountByUserAndProvider(
        actor.id,
        'google',
        'youtube-connect',
      );
    if (!oauthAccount) {
      throw this.buildGoogleOauthRequiredException(
        'oauth-account-not-found',
        actor,
      );
    }

    const now = Date.now();
    const currentAccessToken = oauthAccount.accessToken;
    const tokenExpiresAt = oauthAccount.tokenExpiresAt;
    if (
      currentAccessToken &&
      (!tokenExpiresAt || tokenExpiresAt.getTime() - now > 30_000)
    ) {
      return currentAccessToken;
    }

    if (!oauthAccount.refreshToken) {
      throw this.buildGoogleOauthRequiredException(
        'missing-refresh-token',
        actor,
      );
    }

    const refreshed = await this.authService.refreshGoogleOauthTokensForUser(
      actor.id,
      actor,
    );
    return refreshed.accessToken;
  }

  private async fetchAnalyticsReport(
    actor: RequestUser,
    days: number,
  ): Promise<YoutubeAnalyticsResponse> {
    const { start, end } = this.resolveAnalyticsWindow(days);

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
      actor,
    );
  }

  private async fetchAudienceDemographics(
    actor: RequestUser,
    days: number,
  ): Promise<YoutubeDemographicsFetchResult> {
    const { start, end } = this.resolveAnalyticsWindow(days);

    const ageQuery = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup',
    });

    const genderQuery = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics: 'viewerPercentage',
      dimensions: 'gender',
    });

    const countryQuery = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics: 'views',
      dimensions: 'country',
      sort: '-views',
      maxResults: '25',
    });

    const [ageResponse, genderResponse, countryResponse] =
      await Promise.allSettled([
        this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
          `https://youtubeanalytics.googleapis.com/v2/reports?${ageQuery.toString()}`,
          actor,
        ),
        this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
          `https://youtubeanalytics.googleapis.com/v2/reports?${genderQuery.toString()}`,
          actor,
        ),
        this.fetchGoogleJsonWithRefresh<YoutubeAnalyticsResponse>(
          `https://youtubeanalytics.googleapis.com/v2/reports?${countryQuery.toString()}`,
          actor,
        ),
      ]);

    const failures = [ageResponse, genderResponse, countryResponse].filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    const fatalFailure = failures.find(
      (result) => !this.isRecoverableDemographicsError(result.reason),
    );
    if (fatalFailure) {
      throw fatalFailure.reason;
    }

    return {
      demographics: {
        ageGroups:
          ageResponse.status === 'fulfilled'
            ? this.mapAgeGroupRows(ageResponse.value.rows)
            : [],
        genders:
          genderResponse.status === 'fulfilled'
            ? this.mapGenderRows(genderResponse.value.rows)
            : [],
        countries:
          countryResponse.status === 'fulfilled'
            ? this.mapCountryRows(countryResponse.value.rows)
            : [],
        startDate: start,
        endDate: end,
      },
      warning: failures.length
        ? 'Some YouTube audience demographics are unavailable for this account.'
        : null,
    };
  }

  private mapAgeGroupRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ ageGroup: string; viewerPercentage: number }> {
    if (!rows?.length) {
      return [];
    }

    return rows
      .map((row) => {
        const value = row[0];
        const percentage = row[1];
        if (typeof value !== 'string' || typeof percentage !== 'number') {
          return null;
        }
        return { ageGroup: value, viewerPercentage: percentage };
      })
      .filter(
        (value): value is { ageGroup: string; viewerPercentage: number } =>
          Boolean(value),
      );
  }

  private mapGenderRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ gender: string; viewerPercentage: number }> {
    if (!rows?.length) {
      return [];
    }

    return rows
      .map((row) => {
        const value = row[0];
        const percentage = row[1];
        if (typeof value !== 'string' || typeof percentage !== 'number') {
          return null;
        }
        return { gender: value, viewerPercentage: percentage };
      })
      .filter((value): value is { gender: string; viewerPercentage: number } =>
        Boolean(value),
      );
  }

  private mapCountryRows(
    rows: YoutubeAnalyticsRow[] | undefined,
  ): Array<{ country: string; viewerPercentage: number }> {
    if (!rows?.length) {
      return [];
    }

    const mappedRows = rows
      .map((row) => {
        const value = row[0];
        const views = row[1];
        if (
          typeof value !== 'string' ||
          typeof views !== 'number' ||
          !Number.isFinite(views) ||
          views < 0
        ) {
          return null;
        }
        return { country: value, views };
      })
      .filter((value): value is { country: string; views: number } =>
        Boolean(value),
      );

    const totalViews = mappedRows.reduce((sum, row) => sum + row.views, 0);
    return mappedRows.map((row) => ({
      country: row.country,
      viewerPercentage: totalViews > 0 ? row.views / totalViews : 0,
    }));
  }

  private async fetchVideoComments(
    actor: RequestUser,
    videoIds: string[],
    videos: YoutubeVideosResponse,
  ): Promise<YoutubeCommentsByVideo[]> {
    const videoCommentCounts = new Map<string, number>();
    for (const item of videos.items || []) {
      if (!item.id) {
        continue;
      }
      const commentCount = Number(item.statistics?.commentCount ?? 0);
      videoCommentCounts.set(
        item.id,
        Number.isFinite(commentCount) ? commentCount : 0,
      );
    }

    const results = await Promise.all(
      videoIds.map(async (videoId) => {
        const [topComments, latestComments] = await Promise.all([
          this.fetchCommentThreads(actor, videoId, 'relevance', 20, 'top'),
          this.fetchCommentThreads(actor, videoId, 'time', 50, 'latest'),
        ]);

        const uniqueComments = this.dedupeYoutubeComments([
          ...topComments,
          ...latestComments,
        ]);
        const sampleComments = uniqueComments.slice(0, 5);

        return {
          videoId,
          commentCount: videoCommentCounts.get(videoId) ?? 0,
          topComments,
          latestComments,
          sampleComments,
        };
      }),
    );

    return results;
  }

  private async fetchCommentThreads(
    actor: RequestUser,
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

    let response: YoutubeCommentThreadResponse;
    try {
      response =
        await this.fetchGoogleJsonWithRefresh<YoutubeCommentThreadResponse>(
          `https://www.googleapis.com/youtube/v3/commentThreads?${query.toString()}`,
          actor,
        );
    } catch (error) {
      if (this.isGoogleCommentsDisabledError(error)) {
        return [];
      }
      throw error;
    }

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
        } as YoutubeComment;
      })
      .filter((comment): comment is YoutubeComment => Boolean(comment));
  }

  private dedupeYoutubeComments(comments: YoutubeComment[]): YoutubeComment[] {
    const seen = new Set<string>();
    const uniqueComments: YoutubeComment[] = [];

    for (const comment of comments) {
      if (seen.has(comment.commentId)) {
        continue;
      }
      seen.add(comment.commentId);
      uniqueComments.push(comment);
    }

    return uniqueComments;
  }

  private resolveAnalyticsWindow(days: number) {
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
    actor: RequestUser,
  ): Promise<T> {
    const accessToken = await this.resolveGoogleAccessToken(actor);

    try {
      return await this.fetchGoogleJson<T>(url, accessToken);
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        const details = error.details as { status?: number } | undefined;
        if (details?.status === 401) {
          const refreshed =
            await this.authService.refreshGoogleOauthTokensForUser(
              actor.id,
              actor,
            );
          return this.fetchGoogleJson<T>(url, refreshed.accessToken);
        }
      }

      throw error;
    }
  }

  private async fetchGoogleJson<T>(
    url: string,
    accessToken: string,
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await this.parseGoogleErrorBody(response);
      const reason =
        this.resolveGoogleErrorReason(errorBody) ||
        `google-api-${response.status}`;

      this.logger.warn(
        `Google API request failed: ${response.status} ${reason} (${url})`,
      );
      if (response.status === 401) {
        throw new InvalidTokenException({
          provider: 'google',
          reason,
          status: response.status,
          googleError: errorBody,
        });
      }

      if (response.status === 403) {
        throw new InsufficientPermissionsException(
          'youtube.readonly + youtube.force-ssl + yt-analytics.readonly',
          {
            provider: 'google',
            reason,
            googleError: errorBody,
          },
        );
      }

      throw new ExternalApiException('Google APIs', {
        status: response.status,
        reason,
        googleError: errorBody,
      });
    }

    return (await response.json()) as T;
  }

  private async parseGoogleErrorBody(
    response: globalThis.Response,
  ): Promise<unknown> {
    const raw = await response.text();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }

  private resolveGoogleErrorReason(errorBody: unknown): string | null {
    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const root = errorBody as {
      error?: {
        message?: unknown;
        status?: unknown;
        errors?: Array<{
          reason?: unknown;
        }>;
      };
    };

    const firstReason = root.error?.errors?.[0]?.reason;
    if (typeof firstReason === 'string' && firstReason.trim()) {
      return firstReason;
    }

    if (typeof root.error?.status === 'string' && root.error.status.trim()) {
      return root.error.status;
    }

    if (typeof root.error?.message === 'string' && root.error.message.trim()) {
      return root.error.message;
    }

    return null;
  }

  private isRecoverableDemographicsError(error: unknown): boolean {
    return (
      error instanceof InsufficientPermissionsException ||
      error instanceof ExternalApiException
    );
  }

  private isGoogleScopeInsufficientError(
    error: InsufficientPermissionsException,
  ): boolean {
    const details = error.details as
      | {
          reason?: unknown;
          googleError?: {
            error?: {
              details?: Array<{
                reason?: unknown;
              }>;
            };
          };
        }
      | undefined;

    if (details?.reason === 'insufficientPermissions') {
      return true;
    }

    return (
      details?.googleError?.error?.details?.some(
        (item) => item.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
      ) ?? false
    );
  }

  private isGoogleCommentsDisabledError(error: unknown): boolean {
    if (!(error instanceof InsufficientPermissionsException)) {
      return false;
    }

    const details = error.details as { reason?: unknown } | undefined;
    return details?.reason === 'commentsDisabled';
  }

  private buildGoogleOauthRequiredException(
    reason: string,
    actor: RequestUser,
    extraDetails?: Record<string, unknown>,
  ): InvalidTokenException {
    const oauthHint = this.prepareGoogleOauth2Youtube(actor);
    const safeExtraDetails = extraDetails ? { ...extraDetails } : {};
    delete safeExtraDetails.reason;

    return new InvalidTokenException({
      provider: 'google',
      reason,
      action: 'oauth2-link-required',
      authorizationUrl: oauthHint.authorizationUrl,
      redirectUri: oauthHint.redirectUri,
      ...safeExtraDetails,
    });
  }

  private resolveLoginRole(state?: string): 'sme' | 'creator' {
    if (!state) {
      return 'creator';
    }

    const payload = this.authService.parseOauthState(state);
    if (payload.purpose !== 'login') {
      return 'creator';
    }

    return payload.role === 'sme' ? 'sme' : 'creator';
  }
}
