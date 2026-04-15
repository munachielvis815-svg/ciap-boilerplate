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
        analytics: {
          columnHeaders: [],
          rows: [],
        },
        limits: { days: 30, maxVideos: 10 },
        bullmq: {
          queue: 'youtube-metrics',
          jobName: 'youtube-metrics.pull',
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
      addCreatorInfluenceJob: jest.fn().mockResolvedValue('job-2'),
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
});
