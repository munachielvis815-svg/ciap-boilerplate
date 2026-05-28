import {
  ExternalApiException,
  InvalidTokenException,
  InsufficientPermissionsException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';
import { SocialsService } from './socials.service';
import { YoutubeMetricsQueryDto } from '../dto/youtube-metrics-query.dto';

describe('SocialsService', () => {
  it('returns oauth2-link-required details when stored Google token lacks YouTube scopes', async () => {
    const authService = {
      prepareGoogleOauth: jest.fn().mockReturnValue({
        authorizationUrl:
          'https://accounts.google.com/o/oauth2/v2/auth?youtube=1',
        redirectUri: 'http://localhost:3000/ingestion/youtube/oauth2/callback',
        purpose: 'youtube-connect',
      }),
      refreshGoogleOauthTokensForUser: jest.fn(),
      parseOauthState: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue({
        id: 7,
        userId: 23,
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'creator@example.com',
        accessToken: 'login-scope-token',
        refreshToken: 'login-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60_000),
      }),
    } as never;

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
        email: 'creator@example.com',
      }),
    } as never;

    const service = new SocialsService(
      authService,
      authRepository,
      usersRepository,
    );

    jest.spyOn(service as never, 'fetchGoogleJson').mockRejectedValueOnce(
      new InsufficientPermissionsException(
        'youtube.readonly + yt-analytics.readonly',
        {
          provider: 'google',
          reason: 'insufficientPermissions',
          googleError: {
            error: {
              status: 'PERMISSION_DENIED',
            },
          },
        },
      ),
    );

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'session-1',
    };
    const query = new YoutubeMetricsQueryDto();

    let thrown: unknown;
    try {
      await service.getYoutubeMetrics(actor, query);
    } catch (error) {
      thrown = error;
    }

    expect(
      authRepository.findOauthAccountByUserAndProvider,
    ).toHaveBeenCalledWith(actor.id, 'google', 'youtube-connect');
    expect(thrown).toBeInstanceOf(InvalidTokenException);
    expect((thrown as InvalidTokenException).getResponse()).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          action: 'oauth2-link-required',
          reason: 'insufficient-youtube-scopes',
          authorizationUrl:
            'https://accounts.google.com/o/oauth2/v2/auth?youtube=1',
          requiredScopes: expect.arrayContaining([
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
          ]),
        }),
      }),
    );
  });

  it('skips comment pulls when a video has disabled comments', async () => {
    const authService = {
      prepareGoogleOauth: jest.fn(),
      refreshGoogleOauthTokensForUser: jest.fn(),
      parseOauthState: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue({
        id: 7,
        userId: 23,
        purpose: 'youtube-connect',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'creator@example.com',
        accessToken: 'youtube-access-token',
        refreshToken: 'youtube-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60_000),
      }),
    } as never;

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
        email: 'creator@example.com',
      }),
    } as never;

    const service = new SocialsService(
      authService,
      authRepository,
      usersRepository,
    );

    jest
      .spyOn(service as never, 'fetchGoogleJsonWithRefresh')
      .mockImplementation(async (url: string) => {
        if (url.includes('/channels?')) {
          return {
            items: [{ id: 'UC123' }],
          };
        }

        if (url.includes('/search?')) {
          return {
            items: [{ id: { videoId: 'video-1' } }],
          };
        }

        if (url.includes('/videos?')) {
          return {
            items: [
              {
                id: 'video-1',
                statistics: { commentCount: '0' },
              },
            ],
          };
        }

        if (url.includes('commentThreads')) {
          throw new InsufficientPermissionsException('comments unavailable', {
            provider: 'google',
            reason: 'commentsDisabled',
          });
        }

        return {
          columnHeaders: [],
          rows: [],
        };
      });

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'session-1',
    };

    const result = await service.getYoutubeMetrics(
      actor,
      new YoutubeMetricsQueryDto(),
    );

    expect(result.comments).toEqual([
      expect.objectContaining({
        videoId: 'video-1',
        topComments: [],
        latestComments: [],
        sampleComments: [],
      }),
    ]);
  });

  it('deduplicates repeated comment ids across top and latest comment pulls', async () => {
    const authService = {
      prepareGoogleOauth: jest.fn(),
      refreshGoogleOauthTokensForUser: jest.fn(),
      parseOauthState: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue({
        id: 7,
        userId: 23,
        purpose: 'youtube-connect',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'creator@example.com',
        accessToken: 'youtube-access-token',
        refreshToken: 'youtube-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60_000),
      }),
    } as never;

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
        email: 'creator@example.com',
      }),
    } as never;

    const service = new SocialsService(
      authService,
      authRepository,
      usersRepository,
    );

    jest
      .spyOn(service as never, 'fetchGoogleJsonWithRefresh')
      .mockImplementation(async (url: string) => {
        if (url.includes('/channels?')) {
          return {
            items: [{ id: 'UC123' }],
          };
        }

        if (url.includes('/search?')) {
          return {
            items: [{ id: { videoId: 'video-1' } }],
          };
        }

        if (url.includes('/videos?')) {
          return {
            items: [
              {
                id: 'video-1',
                statistics: { commentCount: '2' },
              },
            ],
          };
        }

        if (url.includes('commentThreads') && url.includes('order=relevance')) {
          return {
            items: [
              {
                id: 'thread-1',
                snippet: {
                  topLevelComment: {
                    id: 'comment-1',
                    snippet: {
                      textDisplay: 'First',
                      textOriginal: 'First',
                      authorDisplayName: 'Author 1',
                      likeCount: 1,
                      publishedAt: '2026-05-01T00:00:00.000Z',
                      updatedAt: '2026-05-01T00:00:00.000Z',
                    },
                  },
                },
              },
            ],
          };
        }

        if (url.includes('commentThreads') && url.includes('order=time')) {
          return {
            items: [
              {
                id: 'thread-1-latest',
                snippet: {
                  topLevelComment: {
                    id: 'comment-1',
                    snippet: {
                      textDisplay: 'First',
                      textOriginal: 'First',
                      authorDisplayName: 'Author 1',
                      likeCount: 1,
                      publishedAt: '2026-05-01T00:00:00.000Z',
                      updatedAt: '2026-05-01T00:00:00.000Z',
                    },
                  },
                },
              },
              {
                id: 'thread-2-latest',
                snippet: {
                  topLevelComment: {
                    id: 'comment-2',
                    snippet: {
                      textDisplay: 'Second',
                      textOriginal: 'Second',
                      authorDisplayName: 'Author 2',
                      likeCount: 0,
                      publishedAt: '2026-05-02T00:00:00.000Z',
                      updatedAt: '2026-05-02T00:00:00.000Z',
                    },
                  },
                },
              },
            ],
          };
        }

        return { columnHeaders: [], rows: [] };
      });

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'session-1',
    };

    const result = await service.getYoutubeMetrics(
      actor,
      new YoutubeMetricsQueryDto(),
    );

    expect(result.comments).toEqual([
      expect.objectContaining({
        videoId: 'video-1',
        sampleComments: [
          expect.objectContaining({ commentId: 'comment-1' }),
          expect.objectContaining({ commentId: 'comment-2' }),
        ],
      }),
    ]);
    expect(result.comments[0]?.sampleComments).toHaveLength(2);
  });

  it('derives country audience share from country views', async () => {
    const authService = {
      prepareGoogleOauth: jest.fn(),
      refreshGoogleOauthTokensForUser: jest.fn(),
      parseOauthState: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue({
        id: 7,
        userId: 23,
        purpose: 'youtube-connect',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'creator@example.com',
        accessToken: 'youtube-access-token',
        refreshToken: 'youtube-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60_000),
      }),
    } as never;

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
        email: 'creator@example.com',
      }),
    } as never;

    const service = new SocialsService(
      authService,
      authRepository,
      usersRepository,
    );

    jest
      .spyOn(service as never, 'fetchGoogleJsonWithRefresh')
      .mockImplementation(async (url: string) => {
        if (url.includes('/channels?')) {
          return {
            items: [{ id: 'UC123' }],
          };
        }

        if (url.includes('/search?')) {
          return { items: [] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=ageGroup')
        ) {
          return { rows: [['18-24', 0.32]] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=gender')
        ) {
          return { rows: [['female', 0.48]] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=country')
        ) {
          expect(url).toContain('metrics=views');
          return {
            rows: [
              ['US', 70],
              ['NG', 30],
            ],
          };
        }

        return { columnHeaders: [], rows: [] };
      });

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'session-1',
    };

    const result = await service.getYoutubeMetrics(
      actor,
      new YoutubeMetricsQueryDto(),
    );

    expect(result.demographicsStatus).toBe('success');
    expect(result.demographics?.countries).toEqual([
      { country: 'US', viewerPercentage: 0.7 },
      { country: 'NG', viewerPercentage: 0.3 },
    ]);
  });

  it('downgrades recoverable demographics query failures to warnings', async () => {
    const authService = {
      prepareGoogleOauth: jest.fn(),
      refreshGoogleOauthTokensForUser: jest.fn(),
      parseOauthState: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue({
        id: 7,
        userId: 23,
        purpose: 'youtube-connect',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'creator@example.com',
        accessToken: 'youtube-access-token',
        refreshToken: 'youtube-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60_000),
      }),
    } as never;

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
        email: 'creator@example.com',
      }),
    } as never;

    const service = new SocialsService(
      authService,
      authRepository,
      usersRepository,
    );

    jest
      .spyOn(service as never, 'fetchGoogleJsonWithRefresh')
      .mockImplementation(async (url: string) => {
        if (url.includes('/channels?')) {
          return {
            items: [{ id: 'UC123' }],
          };
        }

        if (url.includes('/search?')) {
          return { items: [] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=ageGroup')
        ) {
          return { rows: [['18-24', 0.32]] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=gender')
        ) {
          return { rows: [['female', 0.48]] };
        }

        if (
          url.includes('youtubeanalytics.googleapis.com') &&
          url.includes('dimensions=country')
        ) {
          throw new ExternalApiException('Google APIs', {
            status: 400,
            reason: 'badRequest',
          });
        }

        return { columnHeaders: [], rows: [] };
      });

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'session-1',
    };

    const result = await service.getYoutubeMetrics(
      actor,
      new YoutubeMetricsQueryDto(),
    );

    expect(result.demographicsStatus).toBe('warning');
    expect(result.demographicsWarning).toContain(
      'Some YouTube audience demographics',
    );
    expect(result.demographics).toEqual(
      expect.objectContaining({
        ageGroups: [{ ageGroup: '18-24', viewerPercentage: 0.32 }],
        genders: [{ gender: 'female', viewerPercentage: 0.48 }],
        countries: [],
      }),
    );
  });
});
