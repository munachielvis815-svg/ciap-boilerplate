import { Injectable, Inject } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import {
  youtubeChannels,
  youtubeVideos,
  youtubeDailyAnalytics,
  NewYoutubeChannel,
  NewYoutubeVideo,
  NewYoutubeDailyAnalytics,
  YoutubeChannel,
  YoutubeVideo,
  YoutubeDailyAnalytics,
} from '@database/drizzle/schema';

/**
 * YouTube Repository
 * Handles all YouTube-related database operations: channels, videos, analytics.
 */
@Injectable()
export class YoutubeRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  /**
   * Upsert a YouTube channel.
   * Inserts new or updates existing channel by youtubeChannelId.
   */
  async upsertChannel(channel: NewYoutubeChannel): Promise<YoutubeChannel> {
    const result = await this.db
      .insert(youtubeChannels)
      .values(channel)
      .onConflictDoUpdate({
        target: youtubeChannels.youtubeChannelId,
        set: {
          channelTitle: channel.channelTitle,
          channelDescription: channel.channelDescription,
          thumbnailUrl: channel.thumbnailUrl,
          totalViewCount: channel.totalViewCount,
          subscriberCount: channel.subscriberCount,
          videoCount: channel.videoCount,
          uploadPlaylistId: channel.uploadPlaylistId,
        },
      })
      .returning();

    return result[0];
  }

  /**
   * Upsert multiple videos for a channel.
   */
  async upsertVideos(videos: NewYoutubeVideo[]): Promise<YoutubeVideo[]> {
    if (videos.length === 0) return [];

    return this.db
      .insert(youtubeVideos)
      .values(videos)
      .onConflictDoUpdate({
        target: youtubeVideos.youtubeVideoId,
        set: {
          videoTitle: videos[0]?.videoTitle,
          videoDescription: videos[0]?.videoDescription,
          publishedAt: videos[0]?.publishedAt,
          durationSeconds: videos[0]?.durationSeconds,
          viewCount: videos[0]?.viewCount,
          likeCount: videos[0]?.likeCount,
          commentCount: videos[0]?.commentCount,
        },
      })
      .returning();
  }

  /**
   * Upsert daily analytics for a channel.
   */
  async upsertDailyAnalytics(
    analytics: NewYoutubeDailyAnalytics[],
  ): Promise<YoutubeDailyAnalytics[]> {
    if (analytics.length === 0) return [];

    return this.db
      .insert(youtubeDailyAnalytics)
      .values(analytics)
      .onConflictDoUpdate({
        target: [
          youtubeDailyAnalytics.channelId,
          youtubeDailyAnalytics.analyticsDate,
        ],
        set: {
          views: analytics[0]?.views,
          estimatedMinutesWatched: analytics[0]?.estimatedMinutesWatched,
          averageViewDurationSeconds: analytics[0]?.averageViewDurationSeconds,
          subscribersGained: analytics[0]?.subscribersGained,
          subscribersLost: analytics[0]?.subscribersLost,
        },
      })
      .returning();
  }

  /**
   * Get a channel by YouTubeChannelId.
   */
  async getChannelByYoutubeId(
    youtubeChannelId: string,
  ): Promise<YoutubeChannel | null> {
    const result = await this.db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.youtubeChannelId, youtubeChannelId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get the latest YouTube channel for a user.
   * Returns the most recently synced channel.
   */
  async getLatestChannelForUser(
    userId: number,
  ): Promise<YoutubeChannel | null> {
    const result = await this.db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.userId, userId))
      .orderBy(desc(youtubeChannels.createdAt))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get recent videos for a channel, ordered by published date (newest first).
   */
  async getRecentVideos(
    channelId: number,
    limit: number = 10,
  ): Promise<YoutubeVideo[]> {
    return this.db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.channelId, channelId))
      .orderBy(desc(youtubeVideos.publishedAt))
      .limit(limit);
  }

  /**
   * Get all daily analytics for a channel within a date range.
   */
  async getAnalyticsForDateRange(
    channelId: number,
  ): Promise<YoutubeDailyAnalytics[]> {
    return this.db
      .select()
      .from(youtubeDailyAnalytics)
      .where(eq(youtubeDailyAnalytics.channelId, channelId))
      .orderBy(desc(youtubeDailyAnalytics.analyticsDate))
      .execute();
  }

  /**
   * Get videos with engagement metrics for channel.
   */
  async getChannelVideosWithEngagement(
    channelId: number,
  ): Promise<YoutubeVideo[]> {
    return this.db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.channelId, channelId))
      .orderBy(desc(youtubeVideos.viewCount));
  }

  /**
   * Delete a channel and all related data (cascade).
   */
  async deleteChannel(channelId: number): Promise<void> {
    await this.db
      .delete(youtubeChannels)
      .where(eq(youtubeChannels.id, channelId));
  }
}
