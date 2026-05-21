import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import {
  contentItems,
  smeScoutedCreators,
  userProfiles,
  users,
  youtubeChannels,
  youtubeDailyAnalytics,
  youtubeVideos,
  youtubeMlScores,
} from '@database/drizzle/schema';

@Injectable()
export class CreatorDiscoveryRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async searchCreators(params: {
    query?: string;
    bioQuery?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram' | 'other';
    minInfluenceScore?: number;
    maxInfluenceScore?: number;
    limit: number;
    offset: number;
  }) {
    const filters = [eq(users.role, 'creator')];

    if (params.query) {
      const like = `%${params.query}%`;
      filters.push(
        or(
          ilike(userProfiles.displayName, like),
          ilike(userProfiles.bio, like),
        )!,
      );
    }

    if (params.bioQuery) {
      const like = `%${params.bioQuery}%`;
      filters.push(ilike(userProfiles.bio, like));
    }

    if (params.minInfluenceScore !== undefined) {
      filters.push(
        sql`${userProfiles.influenceScore} >= ${params.minInfluenceScore}`,
      );
    }

    if (params.maxInfluenceScore !== undefined) {
      filters.push(
        sql`${userProfiles.influenceScore} <= ${params.maxInfluenceScore}`,
      );
    }

    const query = this.db
      .select({
        userId: users.id,
        displayName: userProfiles.displayName,
        bio: userProfiles.bio,
        influenceScore: userProfiles.influenceScore,
        audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id));

    if (params.platform) {
      query.innerJoin(
        contentItems,
        and(
          eq(contentItems.userId, users.id),
          eq(contentItems.platform, params.platform),
        ),
      );
    }

    return query
      .where(and(...filters))
      .orderBy(
        desc(userProfiles.influenceScore),
        desc(userProfiles.audienceSize),
        desc(users.id),
      )
      .limit(params.limit)
      .offset(params.offset);
  }

  async getCreatorsByIds(ids: number[]) {
    return this.db
      .select({
        userId: users.id,
        displayName: userProfiles.displayName,
        influenceScore: userProfiles.influenceScore,
        audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.role, 'creator'), inArray(users.id, ids)));
  }

  async getUserProfileByUserId(userId: number) {
    const result = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async getLatestChannelForUser(userId: number) {
    const result = await this.db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.userId, userId))
      .orderBy(desc(youtubeChannels.createdAt))
      .limit(1);

    return result[0] || null;
  }

  async getAnalyticsSince(channelId: number, since: Date) {
    return this.db
      .select()
      .from(youtubeDailyAnalytics)
      .where(
        and(
          eq(youtubeDailyAnalytics.channelId, channelId),
          gte(youtubeDailyAnalytics.analyticsDate, since),
        ),
      )
      .orderBy(desc(youtubeDailyAnalytics.analyticsDate));
  }

  async getRecentVideosWithScores(channelId: number, limit: number) {
    return this.db
      .select({
        video: youtubeVideos,
        score: youtubeMlScores,
      })
      .from(youtubeVideos)
      .leftJoin(youtubeMlScores, eq(youtubeMlScores.videoId, youtubeVideos.id))
      .where(eq(youtubeVideos.channelId, channelId))
      .orderBy(desc(youtubeVideos.publishedAt))
      .limit(limit);
  }

  async findCreatorById(creatorUserId: number) {
    const result = await this.db
      .select({
        userId: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, creatorUserId))
      .limit(1);

    return result[0] || null;
  }

  async getScoutedCreatorsForSme(smeUserId: number) {
    return this.db
      .select({
        userId: users.id,
        displayName: userProfiles.displayName,
        status: smeScoutedCreators.status,
        audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
        influenceScore: userProfiles.influenceScore,
        category: sql<
          string | null
        >`nullif(${userProfiles.creatorTypes}[1], '')`,
      })
      .from(smeScoutedCreators)
      .innerJoin(users, eq(users.id, smeScoutedCreators.creatorUserId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(smeScoutedCreators.smeUserId, smeUserId))
      .orderBy(desc(smeScoutedCreators.updatedAt), desc(users.id));
  }

  async scoutCreator(smeUserId: number, creatorUserId: number): Promise<void> {
    await this.db
      .insert(smeScoutedCreators)
      .values({
        smeUserId,
        creatorUserId,
        status: 'scouted',
      })
      .onConflictDoUpdate({
        target: [
          smeScoutedCreators.smeUserId,
          smeScoutedCreators.creatorUserId,
        ],
        set: {
          status: 'scouted',
          updatedAt: new Date(),
        },
      });
  }

  async unscoutCreator(
    smeUserId: number,
    creatorUserId: number,
  ): Promise<void> {
    await this.db
      .delete(smeScoutedCreators)
      .where(
        and(
          eq(smeScoutedCreators.smeUserId, smeUserId),
          eq(smeScoutedCreators.creatorUserId, creatorUserId),
        ),
      );
  }
}
