import { Injectable, NotFoundException } from '@nestjs/common';
import { UnauthorizedUserActionException } from '@common/exceptions';
import type { RequestUser } from '@/types';
import { SmeCampaignsRepository } from '../repositories/sme-campaigns.repository';
import type { AddCreatorToCampaignDto } from '../dto/add-creator-to-campaign.dto';
import type { CreateSmeCampaignDto } from '../dto/create-sme-campaign.dto';
import type { CampaignCreatorResponseDto } from '../dto/campaign-creator-response.dto';
import type { SmeCampaignResponseDto } from '../dto/sme-campaign-response.dto';

@Injectable()
export class SmeCampaignsService {
  constructor(private readonly campaignsRepository: SmeCampaignsRepository) {}

  async createCampaign(
    dto: CreateSmeCampaignDto,
    actor: RequestUser,
  ): Promise<SmeCampaignResponseDto> {
    this.assertSmeActor(actor);

    const campaign = await this.campaignsRepository.createCampaign({
      smeUserId: actor.id,
      name: dto.name.trim(),
      description: this.normalizeOptionalString(dto.description),
      budgetAmount: dto.budgetAmount,
      budgetCurrency: this.normalizeOptionalString(dto.budgetCurrency),
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
    });

    return this.mapCampaignResponse(campaign, 0);
  }

  async listCampaigns(actor: RequestUser): Promise<SmeCampaignResponseDto[]> {
    this.assertSmeActor(actor);

    const campaigns = await this.campaignsRepository.findCampaignsBySmeUserId(
      actor.id,
    );

    return campaigns.map(({ campaign, creatorCount }) =>
      this.mapCampaignResponse(campaign, Number(creatorCount ?? 0)),
    );
  }

  async addCreatorToCampaign(
    campaignId: number,
    dto: AddCreatorToCampaignDto,
    actor: RequestUser,
  ): Promise<CampaignCreatorResponseDto> {
    this.assertSmeActor(actor);

    const [campaign, creator] = await Promise.all([
      this.campaignsRepository.findCampaignByIdForSme(campaignId, actor.id),
      this.campaignsRepository.findCreatorSummaryById(dto.creatorId),
    ]);

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    if (!creator || creator.role !== 'creator') {
      throw new NotFoundException(`Creator with ID ${dto.creatorId} not found`);
    }

    const assignment = await this.campaignsRepository.addCreatorToCampaign({
      campaignId,
      creatorUserId: dto.creatorId,
      status: dto.status ?? 'shortlisted',
    });

    return {
      campaignId,
      creatorId: dto.creatorId,
      displayName: creator.displayName ?? null,
      status: assignment.status,
      audienceSize: creator.audienceSize,
      influenceScore: creator.influenceScore ?? null,
      addedAt: assignment.createdAt.toISOString(),
    };
  }

  private mapCampaignResponse(
    campaign: {
      id: number;
      name: string;
      description: string | null;
      status: string;
      budgetAmount: number | null;
      budgetCurrency: string | null;
      startsAt: Date | null;
      endsAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    creatorCount: number,
  ): SmeCampaignResponseDto {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description ?? null,
      status: campaign.status,
      budgetAmount: campaign.budgetAmount ?? null,
      budgetCurrency: campaign.budgetCurrency ?? null,
      startsAt: campaign.startsAt?.toISOString() ?? null,
      endsAt: campaign.endsAt?.toISOString() ?? null,
      creatorCount,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private assertSmeActor(actor: RequestUser): void {
    if (actor.role !== 'sme' && actor.role !== 'admin') {
      throw new UnauthorizedUserActionException('manage SME campaigns');
    }
  }
}
