import { YoutubeIngestionService } from './services/youtube.service';
import { YoutubeMetricsQueryDto } from '@modules/auth/socials/dto/youtube-metrics-query.dto';
import type { RequestUser } from '@/types';

describe('YoutubeIngestionService', () => {
  it('returns sync summary when ingestion succeeds', async () => {
    const socialsService = {
      getYoutubeMetrics: jest.fn().mockResolvedValue({
        channel: {
          id: 'UC123',
          snippet: { title: 'Channel' },
          statistics: {
            viewCount: '4567',
            subscriberCount: '120',
            videoCount: '3',
          },
          contentDetails: { relatedPlaylists: { uploads: 'PL123' } },
        },
        videos: [],
        comments: [],
        demographics: null,
        demographicsStatus: 'success',
        demographicsWarning: null,
        analytics: {
          columnHeaders: [],
          rows: [],
        },
        limits: { days: 30, maxVideos: 10 },
        bullmq: {
          queue: 'youtube',
          jobName: 'youtube.ingestion',
          payload: {
            provider: 'google',
            userId: 1,
            tenantId: 1,
            days: 30,
            maxVideos: 10,
            requestedAt: '2026-04-10T05:00:00.000Z',
          },
        },
      }),
    } as never;

    const normalizationService = {
      normalizeChannel: jest.fn().mockReturnValue({
        userId: 1,
        youtubeChannelId: 'UC123',
        channelTitle: 'Channel',
        channelDescription: null,
        thumbnailUrl: null,
        subscriberCount: 120,
        videoCount: 3,
        totalViewCount: 4567,
        uploadPlaylistId: 'PL123',
      }),
      normalizeVideos: jest.fn().mockReturnValue([]),
      normalizeDailyAnalytics: jest.fn().mockReturnValue([]),
    } as never;

    const repository = {
      upsertChannel: jest.fn().mockResolvedValue({
        id: 10,
        userId: 1,
        youtubeChannelId: 'UC123',
        channelTitle: 'Channel',
        channelDescription: null,
        thumbnailUrl: null,
        subscriberCount: 120,
        videoCount: 3,
        totalViewCount: 4567,
        uploadPlaylistId: 'PL123',
        lastSyncedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      upsertVideos: jest.fn().mockResolvedValue([]),
      upsertDailyAnalytics: jest.fn().mockResolvedValue([]),
    } as never;

    const contentRepository = {
      upsertContentItems: jest.fn().mockResolvedValue([]),
      insertMetrics: jest.fn().mockResolvedValue(undefined),
    } as never;

    const cache = {
      setChannel: jest.fn(),
      setVideos: jest.fn(),
      setAnalytics: jest.fn(),
      invalidateChannel: jest.fn(),
    } as never;

    const queueService = {
      addYoutubeMetricsJob: jest.fn().mockResolvedValue('job-1'),
    } as never;

    const healthService = {
      checkCache: jest.fn().mockResolvedValue({ status: 'ok' }),
    } as never;

    const service = new YoutubeIngestionService(
      socialsService,
      normalizationService,
      repository,
      contentRepository,
      cache,
      queueService,
      healthService,
    );

    const actor: RequestUser = {
      id: 1,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 1,
      sessionId: 'session-1',
    };
    const query = new YoutubeMetricsQueryDto();

    const result = await service.getYoutubeMetrics(actor, query);

    expect(result.videosCount).toBe(0);
    expect(result.analyticsCount).toBe(0);
    expect(result.contentItemsCount).toBe(0);
    expect(result.metricsCount).toBe(0);
    expect(result.jobId).toBe('job-1');
  });

  it('deduplicates repeated comment ids before persisting video comments', async () => {
    const socialsService = {
      getYoutubeMetrics: jest.fn().mockResolvedValue({
        channel: {
          id: 'UC123',
          snippet: { title: 'Channel' },
          statistics: {
            viewCount: '4567',
            subscriberCount: '120',
            videoCount: '1',
          },
          contentDetails: { relatedPlaylists: { uploads: 'PL123' } },
        },
        videos: [
          {
            id: 'video-1',
            snippet: {
              title: 'Video 1',
              publishedAt: '2026-05-01T00:00:00.000Z',
            },
            statistics: {
              viewCount: '100',
              likeCount: '10',
              commentCount: '2',
            },
            contentDetails: { duration: 'PT1M' },
          },
        ],
        comments: [
          {
            videoId: 'video-1',
            commentCount: 2,
            topComments: [
              {
                commentId: 'comment-1',
                textDisplay: 'First',
                textOriginal: 'First',
                authorDisplayName: 'Author 1',
                authorChannelId: 'author-1',
                likeCount: 1,
                publishedAt: '2026-05-01T00:00:00.000Z',
                updatedAt: '2026-05-01T00:00:00.000Z',
                commentType: 'top',
              },
            ],
            latestComments: [
              {
                commentId: 'comment-1',
                textDisplay: 'First',
                textOriginal: 'First',
                authorDisplayName: 'Author 1',
                authorChannelId: 'author-1',
                likeCount: 1,
                publishedAt: '2026-05-01T00:00:00.000Z',
                updatedAt: '2026-05-01T00:00:00.000Z',
                commentType: 'latest',
              },
              {
                commentId: 'comment-2',
                textDisplay: 'Second',
                textOriginal: 'Second',
                authorDisplayName: 'Author 2',
                authorChannelId: 'author-2',
                likeCount: 0,
                publishedAt: '2026-05-02T00:00:00.000Z',
                updatedAt: '2026-05-02T00:00:00.000Z',
                commentType: 'latest',
              },
            ],
            sampleComments: [],
          },
        ],
        demographics: null,
        demographicsStatus: 'success',
        demographicsWarning: null,
        analytics: {
          columnHeaders: [],
          rows: [],
        },
        analyticsStatus: 'success',
        analyticsWarning: null,
        limits: { days: 30, maxVideos: 10 },
        bullmq: {
          queue: 'youtube',
          jobName: 'youtube.ingestion',
          payload: {
            provider: 'google',
            userId: 1,
            tenantId: 1,
            days: 30,
            maxVideos: 10,
            requestedAt: '2026-04-10T05:00:00.000Z',
          },
        },
      }),
    } as never;

    const normalizationService = {
      normalizeChannel: jest.fn().mockReturnValue({
        userId: 1,
        youtubeChannelId: 'UC123',
        channelTitle: 'Channel',
        channelDescription: null,
        thumbnailUrl: null,
        subscriberCount: 120,
        videoCount: 1,
        totalViewCount: 4567,
        uploadPlaylistId: 'PL123',
      }),
      normalizeVideos: jest.fn().mockReturnValue([
        {
          youtubeVideoId: 'video-1',
          videoTitle: 'Video 1',
          videoDescription: null,
          thumbnailUrl: null,
          publishedAt: new Date('2026-05-01T00:00:00.000Z'),
          durationSeconds: 60,
          viewCount: 100,
          likeCount: 10,
          commentCount: 2,
        },
      ]),
      normalizeDailyAnalytics: jest.fn().mockReturnValue([]),
    } as never;

    const repository = {
      upsertChannel: jest.fn().mockResolvedValue({
        id: 10,
        userId: 1,
        youtubeChannelId: 'UC123',
        channelTitle: 'Channel',
        channelDescription: null,
        thumbnailUrl: null,
        subscriberCount: 120,
        videoCount: 1,
        totalViewCount: 4567,
        uploadPlaylistId: 'PL123',
        lastSyncedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      upsertVideos: jest.fn().mockResolvedValue([
        {
          id: 20,
          channelId: 10,
          youtubeVideoId: 'video-1',
          videoTitle: 'Video 1',
          videoDescription: null,
          thumbnailUrl: null,
          publishedAt: new Date('2026-05-01T00:00:00.000Z'),
          durationSeconds: 60,
          viewCount: 100,
          likeCount: 10,
          commentCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      upsertDailyAnalytics: jest.fn().mockResolvedValue([]),
      upsertVideoComments: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      upsertAudienceDemographics: jest.fn().mockResolvedValue([]),
    } as never;

    const contentRepository = {
      upsertContentItems: jest.fn().mockResolvedValue([]),
      insertMetrics: jest.fn().mockResolvedValue(undefined),
    } as never;

    const cache = {
      setChannel: jest.fn(),
      setVideos: jest.fn(),
      setAnalytics: jest.fn(),
      invalidateChannel: jest.fn(),
    } as never;

    const queueService = {
      addYoutubeMetricsJob: jest.fn().mockResolvedValue('job-1'),
    } as never;

    const healthService = {
      checkCache: jest.fn().mockResolvedValue({ status: 'ok' }),
    } as never;

    const service = new YoutubeIngestionService(
      socialsService,
      normalizationService,
      repository,
      contentRepository,
      cache,
      queueService,
      healthService,
    );

    const actor: RequestUser = {
      id: 1,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 1,
      sessionId: 'session-1',
    };

    await service.getYoutubeMetrics(actor, new YoutubeMetricsQueryDto());

    expect(repository.upsertVideoComments).toHaveBeenCalledWith([
      expect.objectContaining({
        youtubeCommentId: 'comment-1',
        commentType: 'top',
      }),
      expect.objectContaining({
        youtubeCommentId: 'comment-2',
        commentType: 'latest',
      }),
    ]);
  });
});
