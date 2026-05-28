import { and, eq, inArray, sql } from 'drizzle-orm';
import type { SharedDatabase } from '@shared/database/client';
import {
  contentItems,
  contentMetrics,
  oauthAccounts,
  users,
  youtubeAudienceDemographics,
  youtubeChannels,
  youtubeDailyAnalytics,
  youtubeVideoComments,
  youtubeVideos,
  type NewContentItem,
  type NewContentMetric,
  type NewOauthAccount,
  type NewYoutubeAudienceDemographic,
  type NewYoutubeChannel,
  type NewYoutubeDailyAnalytics,
  type NewYoutubeVideo,
  type NewYoutubeVideoComment,
  type OauthAccount,
  type User,
  type YoutubeAudienceDemographic,
  type YoutubeChannel,
  type YoutubeDailyAnalytics,
  type YoutubeVideo,
  type YoutubeVideoComment,
} from '@shared/database/drizzle/schema';

export type DueYoutubeSyncUser = {
  userId: number;
  tenantId: number;
  email: string;
  role: User['role'];
  lastSyncedAt: Date | null;
};

export class WorkerYoutubeRepository {
  constructor(public readonly db: SharedDatabase) {}

  async getLatestChannelSyncAt(userId: number): Promise<Date | null> {
    const result = await this.db.execute(sql<{
      last_synced_at: Date | null;
    }>`
      select max(yc.last_synced_at) as last_synced_at
      from youtube_channels yc
      where yc.user_id = ${userId}
    `);

    return (result.rows[0]?.last_synced_at as Date | null) ?? null;
  }

  async findDueYoutubeSyncUsers(
    staleBefore: Date,
    limit: number,
  ): Promise<DueYoutubeSyncUser[]> {
    const result = await this.db.execute(sql<{
      user_id: number;
      tenant_id: number;
      email: string;
      role: User['role'];
      last_synced_at: Date | null;
    }>`
      select
        u.id as user_id,
        u.tenant_id as tenant_id,
        u.email as email,
        u.role as role,
        max(yc.last_synced_at) as last_synced_at
      from users u
      inner join oauth_accounts oa
        on oa.user_id = u.id
       and oa.provider = 'google'
       and oa.purpose = 'youtube-connect'
      left join youtube_channels yc
        on yc.user_id = u.id
      where u.is_active = true
      group by u.id, u.tenant_id, u.email, u.role
      having max(yc.last_synced_at) is null or max(yc.last_synced_at) < ${staleBefore}
      order by coalesce(max(yc.last_synced_at), to_timestamp(0)) asc, u.id asc
      limit ${limit}
    `);

    return result.rows.map((row) => ({
      userId: Number(row.user_id),
      tenantId: Number(row.tenant_id),
      email: String(row.email),
      role: row.role as User['role'],
      lastSyncedAt: row.last_synced_at as Date | null,
    }));
  }

  async findUserById(userId: number): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return result ?? null;
  }

  async findYoutubeOauthAccountByUserId(
    userId: number,
  ): Promise<OauthAccount | null> {
    const result = await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, 'google'),
        eq(oauthAccounts.purpose, 'youtube-connect'),
      ),
    });

    return result ?? null;
  }

  async updateOauthAccountTokens(
    oauthAccountId: number,
    data: Pick<
      NewOauthAccount,
      'accessToken' | 'refreshToken' | 'tokenExpiresAt' | 'email'
    >,
  ): Promise<void> {
    await this.db
      .update(oauthAccounts)
      .set(data)
      .where(eq(oauthAccounts.id, oauthAccountId));
  }

  async upsertChannel(channel: NewYoutubeChannel): Promise<YoutubeChannel> {
    const [saved] = await this.db
      .insert(youtubeChannels)
      .values({
        ...channel,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: youtubeChannels.youtubeChannelId,
        set: {
          userId: channel.userId,
          channelTitle: channel.channelTitle,
          channelDescription: channel.channelDescription,
          thumbnailUrl: channel.thumbnailUrl,
          totalViewCount: channel.totalViewCount,
          subscriberCount: channel.subscriberCount,
          videoCount: channel.videoCount,
          uploadPlaylistId: channel.uploadPlaylistId,
          lastSyncedAt: new Date(),
        },
      })
      .returning();

    return saved;
  }

  async upsertVideos(videos: NewYoutubeVideo[]): Promise<YoutubeVideo[]> {
    if (!videos.length) {
      return [];
    }

    return this.db
      .insert(youtubeVideos)
      .values(
        videos.map((video) => ({
          ...video,
          lastSyncedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: youtubeVideos.youtubeVideoId,
        set: {
          channelId: sql`excluded.channel_id`,
          videoTitle: sql`excluded.video_title`,
          videoDescription: sql`excluded.video_description`,
          publishedAt: sql`excluded.published_at`,
          durationSeconds: sql`excluded.duration_seconds`,
          viewCount: sql`excluded.view_count`,
          likeCount: sql`excluded.like_count`,
          commentCount: sql`excluded.comment_count`,
          lastSyncedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning();
  }

  async upsertDailyAnalytics(
    analytics: NewYoutubeDailyAnalytics[],
  ): Promise<YoutubeDailyAnalytics[]> {
    if (!analytics.length) {
      return [];
    }

    return this.db
      .insert(youtubeDailyAnalytics)
      .values(analytics)
      .onConflictDoUpdate({
        target: [
          youtubeDailyAnalytics.channelId,
          youtubeDailyAnalytics.analyticsDate,
        ],
        set: {
          views: sql`excluded.views`,
          estimatedMinutesWatched: sql`excluded.estimated_minutes_watched`,
          averageViewDurationSeconds: sql`excluded.average_view_duration_seconds`,
          subscribersGained: sql`excluded.subscribers_gained`,
          subscribersLost: sql`excluded.subscribers_lost`,
        },
      })
      .returning();
  }

  async upsertVideoComments(
    comments: NewYoutubeVideoComment[],
  ): Promise<YoutubeVideoComment[]> {
    if (!comments.length) {
      return [];
    }

    return this.db
      .insert(youtubeVideoComments)
      .values(comments)
      .onConflictDoUpdate({
        target: youtubeVideoComments.youtubeCommentId,
        set: {
          videoId: sql`excluded.video_id`,
          commentType: sql`excluded.comment_type`,
          authorDisplayName: sql`excluded.author_display_name`,
          authorChannelId: sql`excluded.author_channel_id`,
          textDisplay: sql`excluded.text_display`,
          textOriginal: sql`excluded.text_original`,
          likeCount: sql`excluded.like_count`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();
  }

  async upsertAudienceDemographics(
    demographics: NewYoutubeAudienceDemographic[],
  ): Promise<YoutubeAudienceDemographic[]> {
    if (!demographics.length) {
      return [];
    }

    return this.db
      .insert(youtubeAudienceDemographics)
      .values(demographics)
      .onConflictDoUpdate({
        target: [
          youtubeAudienceDemographics.channelId,
          youtubeAudienceDemographics.dimensionType,
          youtubeAudienceDemographics.dimensionValue,
          youtubeAudienceDemographics.startDate,
          youtubeAudienceDemographics.endDate,
        ],
        set: {
          viewerPercentage: sql`excluded.viewer_percentage`,
        },
      })
      .returning();
  }

  async upsertContentItems(items: NewContentItem[]) {
    if (!items.length) {
      return [];
    }

    return this.db
      .insert(contentItems)
      .values(items)
      .onConflictDoUpdate({
        target: [contentItems.platform, contentItems.externalId],
        set: {
          userId: sql`excluded.user_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          url: sql`excluded.url`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          publishedAt: sql`excluded.published_at`,
          durationSeconds: sql`excluded.duration_seconds`,
          updatedAt: sql`now()`,
        },
      })
      .returning();
  }

  async replaceMetrics(metrics: NewContentMetric[]): Promise<void> {
    if (!metrics.length) {
      return;
    }

    const coveredDates = [
      ...new Set(
        metrics
          .filter((metric) => metric.periodStart != null)
          .map((metric) => (metric.periodStart as Date).toISOString()),
      ),
    ];

    await this.db.transaction(async (tx) => {
      if (coveredDates.length) {
        await tx.delete(contentMetrics).where(
          and(
            eq(contentMetrics.userId, metrics[0].userId),
            eq(contentMetrics.platform, metrics[0].platform),
            inArray(
              contentMetrics.periodStart,
              coveredDates.map((value) => new Date(value)),
            ),
          ),
        );
      }

      await tx.insert(contentMetrics).values(metrics);
    });
  }
}
