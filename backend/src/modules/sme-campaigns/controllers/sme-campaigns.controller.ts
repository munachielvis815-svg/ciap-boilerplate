import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequireAbilities, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { AuthenticatedRequest } from '@/types/express';
import { SmeCampaignsService } from '../services/sme-campaigns.service';
import { AddCreatorToCampaignDto } from '../dto/add-creator-to-campaign.dto';
import { CampaignCreatorResponseDto } from '../dto/campaign-creator-response.dto';
import { CreateSmeCampaignDto } from '../dto/create-sme-campaign.dto';
import { SmeCampaignResponseDto } from '../dto/sme-campaign-response.dto';

@ApiTags('sme-campaigns')
@Controller('sme/campaigns')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class SmeCampaignsController {
  constructor(private readonly campaignsService: SmeCampaignsService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List campaigns for the authenticated SME' })
  @ApiResponse({ status: 200, type: [SmeCampaignResponseDto] })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:campaign:manage:any')
  async listCampaigns(
    @Req() request: AuthenticatedRequest,
  ): Promise<SmeCampaignResponseDto[]> {
    return this.campaignsService.listCampaigns(request.user);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an SME campaign' })
  @ApiResponse({ status: 201, type: SmeCampaignResponseDto })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:campaign:manage:any')
  async createCampaign(
    @Body() dto: CreateSmeCampaignDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SmeCampaignResponseDto> {
    return this.campaignsService.createCampaign(dto, request.user);
  }

  @Post(':campaignId/creators')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a creator to an SME campaign' })
  @ApiResponse({ status: 201, type: CampaignCreatorResponseDto })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:campaign:manage:any')
  async addCreatorToCampaign(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body() dto: AddCreatorToCampaignDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CampaignCreatorResponseDto> {
    return this.campaignsService.addCreatorToCampaign(
      campaignId,
      dto,
      request.user,
    );
  }
}
