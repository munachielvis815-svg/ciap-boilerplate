import { Injectable } from '@nestjs/common';
import type { RequestUser } from '@/types';
import { CreatorInsightsRepository } from './creator-insights.repository';
import { CreatorInsightsCacheService } from './creator-insights-cache.service';
import type { CreatorAudienceInsightDto } from './dto/creator-audience-insight.dto';
import type {
  CreatorPerformanceInsightDto,
  CreatorPerformanceContentItemDto,
  CreatorPerformanceTimeseriesPointDto,
} from './dto/creator-performance-insight.dto';
import type {
  CreatorContentInsightDto,
  CreatorContentItemDto,
} from './dto/creator-content-insight.dto';

@Injectable()
export class CreatorInsightsService {
  constructor(
    private readonly repository: CreatorInsightsRepository,
    private readonly cache: CreatorInsightsCacheService,
  ) {}

  async getAudienceInsights(
    actor: RequestUser,
    days: number,
  ): Promise<CreatorAudienceInsightDto> {
    const cached = await this.cache.getAudience(actor.id, days);
    if (cached) {
      return cached as unknown as CreatorAudienceInsightDto;
    }

    const [profile, channel] = await Promise.all([
      this.repository.getUserProfile(actor.id),
      this.repository.getLatestChannelForUser(actor.id),
    ]);

    if (!channel) {
      const emptyResponse: CreatorAudienceInsightDto = {
        channel: null,
        audience: {
          views: 0,
          estimatedMinutesWatched: 0,
          averageViewDurationSeconds: 0,
          subscribersGained: 0,
          subscribersLost: 0,
        },
        influenceScore: profile?.influenceScore ?? null,
        windowDays: days,
        syncedAt: null,
      };

      await this.cache.setAudience(actor.id, days, emptyResponse);
      return emptyResponse;
    }

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const analytics = await this.repository.getAnalyticsSince(
      channel.id,
      since,
    );

    const aggregate = analytics.reduce(
      (acc, row) => {
        acc.views += row.views ?? 0;
        acc.estimatedMinutesWatched += row.estimatedMinutesWatched ?? 0;
        acc.averageViewDurationSeconds += row.averageViewDurationSeconds ?? 0;
        acc.subscribersGained += row.subscribersGained ?? 0;
        acc.subscribersLost += row.subscribersLost ?? 0;
        return acc;
      },
      {
        views: 0,
        estimatedMinutesWatched: 0,
        averageViewDurationSeconds: 0,
        subscribersGained: 0,
        subscribersLost: 0,
      },
    );

    if (analytics.length > 0) {
      aggregate.averageViewDurationSeconds = Math.round(
        aggregate.averageViewDurationSeconds / analytics.length,
      );
    }

    const response: CreatorAudienceInsightDto = {
      channel: {
        youtubeChannelId: channel.youtubeChannelId,
        channelTitle: channel.channelTitle ?? null,
        subscriberCount: channel.subscriberCount ?? 0,
        totalViewCount: Number(channel.totalViewCount ?? 0),
        videoCount: channel.videoCount ?? 0,
      },
      audience: aggregate,
      influenceScore: profile?.influenceScore ?? null,
      windowDays: days,
      syncedAt: channel.lastSyncedAt
        ? channel.lastSyncedAt.toISOString()
        : null,
    };

    await this.cache.setAudience(actor.id, days, response);
    return response;
  }

  async getContentInsights(
    actor: RequestUser,
    limit: number,
  ): Promise<CreatorContentInsightDto> {
    const cached = await this.cache.getContent(actor.id, limit);
    if (cached) {
      return cached as unknown as CreatorContentInsightDto;
    }

    const channel = await this.repository.getLatestChannelForUser(actor.id);
    if (!channel) {
      const emptyResponse: CreatorContentInsightDto = {
        youtubeChannelId: null,
        items: [],
        limit,
      };
      await this.cache.setContent(actor.id, limit, emptyResponse);
      return emptyResponse;
    }

    const rows = await this.repository.getRecentVideosWithScores(
      channel.id,
      limit,
    );

    const items: CreatorContentItemDto[] = rows.map((row) => ({
      youtubeVideoId: row.video.youtubeVideoId,
      title: row.video.videoTitle ?? null,
      viewCount: row.video.viewCount ?? 0,
      likeCount: row.video.likeCount ?? 0,
      commentCount: row.video.commentCount ?? 0,
      publishedAt: row.video.publishedAt
        ? row.video.publishedAt.toISOString()
        : null,
      score: {
        engagementScore: row.score?.engagementScore ?? null,
        growthScore: row.score?.growthScore ?? null,
        recommendationScore: row.score?.recommendationScore ?? null,
        performanceRank: row.score?.performanceRank ?? null,
      },
    }));

    const response: CreatorContentInsightDto = {
      youtubeChannelId: channel.youtubeChannelId,
      items,
      limit,
    };

    await this.cache.setContent(actor.id, limit, response);
    return response;
  }

  async getPerformanceInsights(
    actor: RequestUser,
    days: number,
    limit: number,
  ): Promise<CreatorPerformanceInsightDto> {
    const cached = await this.cache.getPerformance(actor.id, days, limit);
    if (cached) {
      return cached as unknown as CreatorPerformanceInsightDto;
    }

    const channel = await this.repository.getLatestChannelForUser(actor.id);
    if (!channel) {
      const emptyResponse = this.buildEmptyPerformance(days);
      await this.cache.setPerformance(actor.id, days, limit, emptyResponse);
      return emptyResponse;
    }

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const [analytics, rows] = await Promise.all([
      this.repository.getAnalyticsSince(channel.id, since),
      this.repository.getRecentVideosWithScores(channel.id, limit),
    ]);

    const timeSeries = this.buildTimeSeries(analytics);
    const weeklySince = new Date();
    weeklySince.setDate(weeklySince.getDate() - 6);

    const weekly = this.aggregateAnalytics(
      analytics.filter((row) => row.analyticsDate >= weeklySince),
      7,
    );
    const monthly = this.aggregateAnalytics(analytics, days);

    const topContent = this.buildTopContent(rows);
    const engagementRate = this.computeEngagementRate(topContent);

    const response: CreatorPerformanceInsightDto = {
      windowDays: days,
      weeklyGrowth: weekly,
      monthlyGrowth: monthly,
      platforms: [
        {
          platform: 'youtube',
          followerGrowth: monthly.followerGrowth,
          views: monthly.views,
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

    await this.cache.setPerformance(actor.id, days, limit, response);
    return response;
  }

  private buildEmptyPerformance(days: number): CreatorPerformanceInsightDto {
    return {
      windowDays: days,
      weeklyGrowth: {
        windowDays: 7,
        followerGrowth: 0,
        views: 0,
        estimatedMinutesWatched: 0,
      },
      monthlyGrowth: {
        windowDays: days,
        followerGrowth: 0,
        views: 0,
        estimatedMinutesWatched: 0,
      },
      platforms: [
        {
          platform: 'youtube',
          followerGrowth: 0,
          views: 0,
          engagementRate: 0,
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
      engagementRate: 0,
      topContent: [],
      timeSeries: [],
      summary: null,
    };
  }

  private buildTimeSeries(
    analytics: Array<{
      analyticsDate: Date;
      views: number | null;
      estimatedMinutesWatched: number | null;
      subscribersGained: number | null;
      subscribersLost: number | null;
    }>,
  ): CreatorPerformanceTimeseriesPointDto[] {
    return [...analytics]
      .sort((a, b) => a.analyticsDate.getTime() - b.analyticsDate.getTime())
      .map((row) => ({
        date: row.analyticsDate.toISOString().slice(0, 10),
        views: row.views ?? 0,
        estimatedMinutesWatched: row.estimatedMinutesWatched ?? 0,
        subscribersGained: row.subscribersGained ?? 0,
        subscribersLost: row.subscribersLost ?? 0,
      }));
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
  ): CreatorPerformanceContentItemDto[] {
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

  private computeEngagementRate(items: CreatorPerformanceContentItemDto[]) {
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
}
