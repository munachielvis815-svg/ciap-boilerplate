import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import {
  smeCampaignCreators,
  smeCampaigns,
  userProfiles,
  users,
} from '@database/drizzle/schema';
import { and, count, eq, sql } from 'drizzle-orm';

@Injectable()
export class SmeCampaignsRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async createCampaign(data: {
    smeUserId: number;
    name: string;
    description?: string;
    budgetAmount?: number;
    budgetCurrency?: string;
    startsAt?: Date;
    endsAt?: Date;
  }) {
    const [campaign] = await this.db
      .insert(smeCampaigns)
      .values({
        smeUserId: data.smeUserId,
        name: data.name,
        description: data.description,
        budgetAmount: data.budgetAmount,
        budgetCurrency: data.budgetCurrency,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      })
      .returning();

    return campaign;
  }

  async findCampaignsBySmeUserId(smeUserId: number) {
    return this.db
      .select({
        campaign: smeCampaigns,
        creatorCount: count(smeCampaignCreators.id),
      })
      .from(smeCampaigns)
      .leftJoin(
        smeCampaignCreators,
        eq(smeCampaignCreators.campaignId, smeCampaigns.id),
      )
      .where(eq(smeCampaigns.smeUserId, smeUserId))
      .groupBy(smeCampaigns.id)
      .orderBy(smeCampaigns.createdAt);
  }

  async findCampaignByIdForSme(campaignId: number, smeUserId: number) {
    const result = await this.db
      .select()
      .from(smeCampaigns)
      .where(
        and(
          eq(smeCampaigns.id, campaignId),
          eq(smeCampaigns.smeUserId, smeUserId),
        ),
      )
      .limit(1);

    return result[0] || null;
  }

  async countCreatorsForCampaign(campaignId: number): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(smeCampaignCreators)
      .where(eq(smeCampaignCreators.campaignId, campaignId));

    return Number(result?.value ?? 0);
  }

  async findCreatorSummaryById(creatorId: number) {
    const result = await this.db
      .select({
        id: users.id,
        role: users.role,
        displayName: userProfiles.displayName,
        audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
        influenceScore: userProfiles.influenceScore,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, creatorId))
      .limit(1);

    return result[0] || null;
  }

  async addCreatorToCampaign(data: {
    campaignId: number;
    creatorUserId: number;
    status: 'shortlisted' | 'invited' | 'active' | 'removed';
  }) {
    const [assignment] = await this.db
      .insert(smeCampaignCreators)
      .values({
        campaignId: data.campaignId,
        creatorUserId: data.creatorUserId,
        status: data.status,
      })
      .onConflictDoUpdate({
        target: [
          smeCampaignCreators.campaignId,
          smeCampaignCreators.creatorUserId,
        ],
        set: {
          status: data.status,
          updatedAt: new Date(),
        },
      })
      .returning();

    return assignment;
  }
}
