import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, RequireAbilities } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { AuthenticatedRequest } from '@/types/express';
import { CreatorInsightsService } from './creator-insights.service';
import { CreatorInsightsQueryDto } from './dto/creator-insights-query.dto';
import { CreatorAudienceInsightDto } from './dto/creator-audience-insight.dto';
import { CreatorContentInsightDto } from './dto/creator-content-insight.dto';

@ApiTags('creator-insights')
@Controller('creators/insights')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class CreatorInsightsController {
  constructor(private readonly insightsService: CreatorInsightsService) {}

  @Get('audience')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get audience insights for creator' })
  @ApiResponse({
    status: 200,
    type: CreatorAudienceInsightDto,
    schema: {
      example: {
        channel: {
          youtubeChannelId: 'UC123456789',
          channelTitle: 'My Channel',
          subscriberCount: 12000,
          totalViewCount: 450000,
          videoCount: 120,
        },
        audience: {
          views: 25000,
          estimatedMinutesWatched: 60000,
          averageViewDurationSeconds: 210,
          subscribersGained: 120,
          subscribersLost: 30,
        },
        influenceScore: 78.5,
        windowDays: 30,
        syncedAt: '2026-04-15T12:00:00.000Z',
      },
    },
  })
  @Roles('admin', 'creator')
  @RequireAbilities('creator:insights:read:any', 'creator:insights:read:self')
  async getAudienceInsights(
    @Req() request: AuthenticatedRequest,
    @Query() query: CreatorInsightsQueryDto,
  ) {
    const days = query.days ?? 30;
    return this.insightsService.getAudienceInsights(request.user, days);
  }

  @Get('content')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get content insights for creator' })
  @ApiResponse({
    status: 200,
    type: CreatorContentInsightDto,
    schema: {
      example: {
        youtubeChannelId: 'UC123456789',
        items: [
          {
            youtubeVideoId: 'dQw4w9WgXcQ',
            title: 'How to grow your channel',
            viewCount: 12000,
            likeCount: 520,
            commentCount: 85,
            publishedAt: '2026-04-10T12:00:00.000Z',
            score: {
              engagementScore: 0.82,
              growthScore: 0.76,
              recommendationScore: 0.88,
              performanceRank: 3,
            },
          },
        ],
        limit: 10,
      },
    },
  })
  @Roles('admin', 'creator')
  @RequireAbilities('creator:insights:read:any', 'creator:insights:read:self')
  async getContentInsights(
    @Req() request: AuthenticatedRequest,
    @Query() query: CreatorInsightsQueryDto,
  ) {
    const limit = query.limit ?? 10;
    return this.insightsService.getContentInsights(request.user, limit);
  }
}
