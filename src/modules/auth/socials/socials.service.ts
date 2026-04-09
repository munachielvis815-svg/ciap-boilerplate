import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AuthService } from '@modules/auth/auth.service';
import { UsersRepository } from '@modules/users/users.repository';
import {
  ExternalApiException,
  InsufficientPermissionsException,
  InvalidTokenException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';
import type { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import type { GoogleAuthDto } from '@modules/auth/dto/google-auth.dto';
import type { YoutubeMetricsQueryDto } from './dto/youtube-metrics-query.dto';
import {
  buildYoutubeMetricsPullJobPayload,
  YOUTUBE_METRICS_PULL_JOB,
  YOUTUBE_METRICS_QUEUE,
} from './youtube-metrics.job';

type YoutubeChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: Record<string, unknown>;
    statistics?: Record<string, unknown>;
    contentDetails?: Record<string, unknown>;
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
  items?: Array<Record<string, unknown>>;
};

type YoutubeAnalyticsResponse = {
  columnHeaders?: Array<Record<string, unknown>>;
  rows?: Array<Array<string | number>>;
};

@Injectable()
export class SocialsService {
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
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogleAuthorizationCode(code, request);
  }

  prepareGoogleOauth2() {
    return this.authService.prepareOauth2('google');
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

  async getYoutubeMetrics(
    actor: RequestUser,
    query: YoutubeMetricsQueryDto,
    providedGoogleAccessToken?: string,
  ) {
    const actorRecord = await this.usersRepository.findByIdOrNull(actor.id);
    if (!actorRecord || actorRecord.tenantId !== actor.tenantId) {
      throw new InvalidTokenException({ reason: 'tenant-context-mismatch' });
    }

    const days = query.days ?? 30;
    const maxVideos = query.maxVideos ?? 20;

    const accessToken = await this.resolveGoogleAccessToken(
      actor,
      providedGoogleAccessToken,
    );
    const channel = await this.fetchGoogleJson<YoutubeChannelResponse>(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
      accessToken,
    );
    const searchResult = await this.fetchGoogleJson<YoutubeSearchResponse>(
      `https://www.googleapis.com/youtube/v3/search?part=id&forMine=true&type=video&order=date&maxResults=${maxVideos}`,
      accessToken,
    );

    const videoIds = (searchResult.items || [])
      .map((item) => item.id?.videoId)
      .filter((value): value is string => Boolean(value));

    const videos = videoIds.length
      ? await this.fetchGoogleJson<YoutubeVideosResponse>(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
          accessToken,
        )
      : { items: [] };

    const analytics = await this.fetchAnalyticsReport(accessToken, days);

    return {
      channel: channel.items?.[0] || null,
      videos: videos.items || [],
      analytics,
      limits: {
        days,
        maxVideos,
      },
      // Prepared payload contract for later BullMQ integration.
      bullmq: {
        queue: YOUTUBE_METRICS_QUEUE,
        jobName: YOUTUBE_METRICS_PULL_JOB,
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
    const maxVideos = query.maxVideos ?? 20;

    return {
      queue: YOUTUBE_METRICS_QUEUE,
      jobName: YOUTUBE_METRICS_PULL_JOB,
      payload: buildYoutubeMetricsPullJobPayload({
        userId: actor.id,
        tenantId: actor.tenantId,
        days,
        maxVideos,
      }),
    };
  }

  private async resolveGoogleAccessToken(
    actor: RequestUser,
    providedGoogleAccessToken?: string,
  ): Promise<string> {
    if (providedGoogleAccessToken?.trim()) {
      return providedGoogleAccessToken.trim();
    }

    const oauthAccount =
      await this.authRepository.findOauthAccountByUserAndProvider(
        actor.id,
        'google',
      );
    if (!oauthAccount) {
      throw new InvalidTokenException({
        provider: 'google',
        reason: 'oauth-account-not-found',
      });
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

    const refreshed = await this.authService.refreshGoogleOauthTokensForUser(
      actor.id,
      actor,
    );
    return refreshed.accessToken;
  }

  private async fetchAnalyticsReport(
    accessToken: string,
    days: number,
  ): Promise<YoutubeAnalyticsResponse> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));

    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    const query = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: start,
      endDate: end,
      metrics:
        'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
      dimensions: 'day',
      sort: 'day',
      maxResults: '90',
    });

    return this.fetchGoogleJson<YoutubeAnalyticsResponse>(
      `https://youtubeanalytics.googleapis.com/v2/reports?${query.toString()}`,
      accessToken,
    );
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
      if (response.status === 401) {
        throw new InvalidTokenException({
          provider: 'google',
          reason:
            this.resolveGoogleErrorReason(errorBody) ||
            `google-api-${response.status}`,
          googleError: errorBody,
        });
      }

      if (response.status === 403) {
        throw new InsufficientPermissionsException(
          'youtube.readonly + yt-analytics.readonly',
          {
            provider: 'google',
            reason:
              this.resolveGoogleErrorReason(errorBody) ||
              `google-api-${response.status}`,
            googleError: errorBody,
          },
        );
      }

      throw new ExternalApiException('Google APIs', {
        status: response.status,
        reason:
          this.resolveGoogleErrorReason(errorBody) ||
          `google-api-${response.status}`,
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
}
