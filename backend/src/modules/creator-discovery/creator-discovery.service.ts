import { Injectable } from '@nestjs/common';
import { CreatorDiscoveryRepository } from './creator-discovery.repository';
import { CreatorDiscoveryCacheService } from './creator-discovery-cache.service';

@Injectable()
export class CreatorDiscoveryService {
  private readonly useExternalSearch = false;

  constructor(
    private readonly repository: CreatorDiscoveryRepository,
    private readonly cache: CreatorDiscoveryCacheService,
  ) {}

  async discoverCreators(
    params: CreatorSearchParams,
  ): Promise<CreatorSearchResponse> {
    const normalizedParams = this.normalizeSearchParams(params);
    const cacheKey = JSON.stringify({
      q: normalizedParams.query || '',
      bq: normalizedParams.bioQuery || '',
      p: normalizedParams.platform || '',
      min: normalizedParams.minInfluenceScore ?? null,
      max: normalizedParams.maxInfluenceScore ?? null,
      limit: normalizedParams.limit,
      offset: normalizedParams.offset,
    });

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as unknown as CreatorSearchResponse;
    }

    const creators = await this.repository.searchCreators(normalizedParams);
    const response = {
      creators,
      limit: normalizedParams.limit,
      offset: normalizedParams.offset,
    };

    await this.cache.set(cacheKey, response);
    return response;
  }

  async compareCreators(params: {
    creatorIds?: number[];
    query?: string;
    limit: number;
  }): Promise<CreatorCompareResponse> {
    const mode: CreatorCompareResponse['mode'] = params.creatorIds?.length
      ? 'ids'
      : 'search';
    const normalizedQuery = this.normalizeOptionalText(params.query);
    const cacheKey = JSON.stringify({
      mode,
      ids: params.creatorIds || [],
      q: normalizedQuery || '',
      limit: params.limit,
    });

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as unknown as CreatorCompareResponse;
    }

    let creators: Array<{
      userId: number;
      displayName: string | null;
      influenceScore: number | null;
      audienceSize: number;
    }>;

    if (params.creatorIds?.length) {
      creators = await this.repository.getCreatorsByIds(params.creatorIds);
    } else {
      creators = await this.repository.searchCreators({
        query: normalizedQuery,
        platform: undefined,
        minInfluenceScore: undefined,
        maxInfluenceScore: undefined,
        limit: params.limit,
        offset: 0,
      });
    }

    const response: CreatorCompareResponse = {
      creators,
      mode,
    };

    await this.cache.set(cacheKey, response);
    return response;
  }

  async searchCreators(
    params: CreatorSearchParams,
  ): Promise<CreatorSearchResponse> {
    // Cache search results to reduce DB load for repeated queries.
    const normalizedParams = this.normalizeSearchParams(params);
    const cacheKey = JSON.stringify({
      mode: 'search',
      q: normalizedParams.query || '',
      bq: normalizedParams.bioQuery || '',
      p: normalizedParams.platform || '',
      min: normalizedParams.minInfluenceScore ?? null,
      max: normalizedParams.maxInfluenceScore ?? null,
      limit: normalizedParams.limit,
      offset: normalizedParams.offset,
    });

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as CreatorSearchResponse;
    }

    const creators = this.useExternalSearch
      ? await this.searchCreatorsExternal(normalizedParams)
      : await this.repository.searchCreators(normalizedParams);

    const response = {
      creators,
      limit: normalizedParams.limit,
      offset: normalizedParams.offset,
    };

    await this.cache.set(cacheKey, response);
    return response;
  }

  private searchCreatorsExternal(
    _params: CreatorSearchParams,
  ): Promise<CreatorSearchItem[]> {
    void _params;
    // TODO: Replace with external search engine integration for scale.
    return Promise.reject(
      new Error(
        'External creator search not configured; use database search for MVP.',
      ),
    );
  }

  async getCreatorProfileForSme(params: {
    creatorId: number;
    days: number;
    limit: number;
  }): Promise<SmeCreatorProfileResponse> {
    const cacheKey = JSON.stringify({
      creatorId: params.creatorId,
      days: params.days,
      limit: params.limit,
    });

    const cached = await this.cache.getProfile(cacheKey);
    if (cached) {
      return cached as unknown as SmeCreatorProfileResponse;
    }

    const [profile, channel] = await Promise.all([
      this.repository.getUserProfileByUserId(params.creatorId),
      this.repository.getLatestChannelForUser(params.creatorId),
    ]);

    let contentPerformance: SmeCreatorProfileResponse['contentPerformance'] =
      null;
    if (channel) {
      const since = new Date();
      since.setDate(since.getDate() - (params.days - 1));

      const [analytics, rows] = await Promise.all([
        this.repository.getAnalyticsSince(channel.id, since),
        this.repository.getRecentVideosWithScores(channel.id, params.limit),
      ]);

      const timeSeries = [...analytics]
        .sort((a, b) => a.analyticsDate.getTime() - b.analyticsDate.getTime())
        .map((row) => ({
          date: row.analyticsDate.toISOString().slice(0, 10),
          views: row.views ?? 0,
          subscribersGained: row.subscribersGained ?? 0,
          subscribersLost: row.subscribersLost ?? 0,
          estimatedMinutesWatched: row.estimatedMinutesWatched ?? 0,
        }));

      const weeklySince = new Date();
      weeklySince.setDate(weeklySince.getDate() - 6);

      const weeklyTotals = this.aggregateAnalytics(
        analytics.filter((row) => row.analyticsDate >= weeklySince),
        7,
      );
      const monthlyTotals = this.aggregateAnalytics(analytics, params.days);

      const topContent = this.buildTopContent(rows);
      const engagementRate = this.computeEngagementRate(topContent);

      contentPerformance = {
        windowDays: params.days,
        weeklyGrowth: weeklyTotals,
        monthlyGrowth: monthlyTotals,
        platforms: [
          {
            platform: 'youtube',
            followerGrowth: monthlyTotals.followerGrowth,
            views: monthlyTotals.views,
            engagementRate,
          },
          {
            platform: 'tiktok',
            followerGrowth: null,
            views: null,
            engagementRate: null,
          },
          {
            platform: 'instagram',
            followerGrowth: null,
            views: null,
            engagementRate: null,
          },
        ],
        engagementRate,
        topContent,
        timeSeries,
        summary: null,
      };
    }

    const response: SmeCreatorProfileResponse = {
      profile: {
        userId: params.creatorId,
        displayName: profile?.displayName ?? null,
        bio: profile?.bio ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        audienceSize: profile?.audienceSize ?? 0,
        influenceScore: profile?.influenceScore ?? null,
      },
      channel: channel
        ? {
            youtubeChannelId: channel.youtubeChannelId,
            channelTitle: channel.channelTitle ?? null,
            subscriberCount: channel.subscriberCount ?? 0,
            totalViewCount: Number(channel.totalViewCount ?? 0),
            videoCount: channel.videoCount ?? 0,
          }
        : null,
      audienceDemographics: {
        ageGroups: [],
        genderSplit: null,
        topLocations: [],
      },
      contentPerformance,
      sentiment: {
        overallScore: null,
        topKeywords: [],
        summary: null,
      },
    };

    await this.cache.setProfile(cacheKey, response);
    return response;
  }

  private aggregateAnalytics(
    analytics: Array<{
      views: number | null;
      estimatedMinutesWatched: number | null;
      subscribersGained: number | null;
      subscribersLost: number | null;
    }>,
    windowDays: number,
  ) {
    const totals = analytics.reduce<{
      views: number;
      estimatedMinutesWatched: number;
      subscribersGained: number;
      subscribersLost: number;
    }>(
      (acc, row) => {
        acc.views += row.views ?? 0;
        acc.estimatedMinutesWatched += row.estimatedMinutesWatched ?? 0;
        acc.subscribersGained += row.subscribersGained ?? 0;
        acc.subscribersLost += row.subscribersLost ?? 0;
        return acc;
      },
      {
        views: 0,
        estimatedMinutesWatched: 0,
        subscribersGained: 0,
        subscribersLost: 0,
      },
    );

    return {
      windowDays,
      followerGrowth: totals.subscribersGained - totals.subscribersLost,
      views: totals.views,
      estimatedMinutesWatched: totals.estimatedMinutesWatched,
    };
  }

  private buildTopContent(
    rows: Array<{
      video: {
        youtubeVideoId: string;
        videoTitle: string | null;
        viewCount: number | null;
        likeCount: number | null;
        commentCount: number | null;
      };
      score: {
        performanceRank: number | null;
      } | null;
    }>,
  ) {
    return [...rows]
      .sort((a, b) => (b.video.viewCount ?? 0) - (a.video.viewCount ?? 0))
      .map((row) => {
        const viewCount = row.video.viewCount ?? 0;
        const likeCount = row.video.likeCount ?? 0;
        const commentCount = row.video.commentCount ?? 0;
        const engagementRate =
          viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;

        return {
          youtubeVideoId: row.video.youtubeVideoId,
          title: row.video.videoTitle ?? null,
          viewCount,
          likeCount,
          commentCount,
          engagementRate,
          performanceRank: row.score?.performanceRank ?? null,
        };
      });
  }

  private computeEngagementRate(
    items: Array<{
      viewCount: number;
      likeCount: number;
      commentCount: number;
    }>,
  ): number {
    const totals = items.reduce(
      (acc, item) => {
        acc.views += item.viewCount;
        acc.engagement += item.likeCount + item.commentCount;
        return acc;
      },
      { views: 0, engagement: 0 },
    );

    if (totals.views === 0) {
      return 0;
    }

    return totals.engagement / totals.views;
  }

  private normalizeSearchParams(
    params: CreatorSearchParams,
  ): CreatorSearchParams {
    return {
      ...params,
      query: this.normalizeOptionalText(params.query),
      bioQuery: this.normalizeOptionalText(params.bioQuery),
    };
  }

  private normalizeOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}

type SmeCreatorProfileResponse = {
  profile: {
    userId: number;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    audienceSize: number;
    influenceScore: number | null;
  };
  channel: {
    youtubeChannelId: string | null;
    channelTitle: string | null;
    subscriberCount: number;
    totalViewCount: number;
    videoCount: number;
  } | null;
  audienceDemographics: {
    ageGroups: Array<{ range: string; percent: number }>;
    genderSplit: { male: number; female: number; other: number } | null;
    topLocations: Array<{ location: string; percent: number }>;
  };
  contentPerformance: {
    windowDays: number;
    weeklyGrowth: {
      windowDays: number;
      followerGrowth: number;
      views: number;
      estimatedMinutesWatched: number;
    };
    monthlyGrowth: {
      windowDays: number;
      followerGrowth: number;
      views: number;
      estimatedMinutesWatched: number;
    };
    platforms: Array<{
      platform: 'youtube' | 'tiktok' | 'instagram' | 'other';
      followerGrowth: number | null;
      views: number | null;
      engagementRate: number | null;
    }>;
    engagementRate: number;
    topContent: Array<{
      youtubeVideoId: string;
      title: string | null;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      engagementRate: number;
      performanceRank: number | null;
    }>;
    timeSeries: Array<{
      date: string;
      views: number;
      subscribersGained: number;
      subscribersLost: number;
      estimatedMinutesWatched: number;
    }>;
    summary: string | null;
  } | null;
  sentiment: {
    overallScore: number | null;
    topKeywords: string[];
    summary: string | null;
  };
};

type CreatorSearchItem = {
  userId: number;
  displayName: string | null;
  bio: string | null;
  influenceScore: number | null;
  audienceSize: number;
};

type CreatorSearchParams = {
  query?: string;
  bioQuery?: string;
  platform?: 'youtube' | 'tiktok' | 'instagram' | 'other';
  minInfluenceScore?: number;
  maxInfluenceScore?: number;
  limit: number;
  offset: number;
};

type CreatorSearchResponse = {
  creators: CreatorSearchItem[];
  limit: number;
  offset: number;
};

type CreatorCompareResponse = {
  creators: Array<{
    userId: number;
    displayName: string | null;
    influenceScore: number | null;
    audienceSize: number;
  }>;
  mode: 'ids' | 'search';
};
