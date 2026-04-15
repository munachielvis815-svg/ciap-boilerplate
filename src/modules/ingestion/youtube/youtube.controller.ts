import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, RequireAbilities, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { AuthenticatedRequest } from '@/types/express';
import { YoutubeMetricsQueryDto } from '@modules/auth/socials/dto/youtube-metrics-query.dto';
import { YoutubeIngestionService } from './services/youtube.service';
import { ApproveYoutubeChannelDto } from './dto/approve-youtube-channel.dto';
import { MissingFieldException } from '@common/exceptions';
import { YoutubeOauthCallbackQueryDto } from './dto/youtube-oauth-callback-query.dto';

@ApiTags('ingestion')
@Controller('ingestion/youtube')
export class YoutubeIngestionController {
  constructor(private readonly ingestionService: YoutubeIngestionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'creator')
  @RequireAbilities('socials:youtube:read:any', 'socials:youtube:read:self')
  @ApiBearerAuth('access-token')
  @Get('metrics')
  @ApiOperation({
    summary:
      'Pull authenticated user YouTube channel, latest 10 videos, and analytics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 30,
  })
  @ApiQuery({
    name: 'maxVideos',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        channel: {
          youtubeChannelId: 'UC123456789',
          channelTitle: 'My Channel',
          subscriberCount: 10243,
          totalViewCount: 234556,
          videoCount: 58,
        },
        videos: [
          {
            youtubeVideoId: 'abc123',
            videoTitle: 'Latest video',
            viewCount: 1234,
            likeCount: 120,
            commentCount: 14,
            publishedAt: '2026-04-10T12:00:00.000Z',
          },
        ],
        videosCount: 1,
        analyticsCount: 30,
        cacheStatus: 'success',
        jobId: 'job-123',
        jobStatus: 'queued',
        syncedAt: '2026-04-15T12:00:00.000Z',
        contentItemsCount: 1,
        metricsCount: 300,
      },
    },
  })
  async getYoutubeMetrics(
    @Req() request: AuthenticatedRequest,
    @Query() query: YoutubeMetricsQueryDto,
  ) {
    return this.ingestionService.getYoutubeMetrics(request.user, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'creator')
  @RequireAbilities('socials:youtube:write:any', 'socials:youtube:write:self')
  @ApiBearerAuth('access-token')
  @Get('oauth2')
  @ApiOperation({
    summary: 'Prepare Google OAuth2 flow to connect YouTube for creators',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        provider: 'google',
        redirectUri: 'http://localhost:3000/ingestion/youtube/oauth2/callback',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        purpose: 'youtube-connect',
      },
    },
  })
  prepareYoutubeOauth(@Req() request: AuthenticatedRequest) {
    return this.ingestionService.prepareYoutubeOauth(request.user);
  }

  @Public()
  @Get('oauth2/callback')
  @ApiOperation({
    summary: 'Google OAuth2 callback for YouTube connect and immediate sync',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'YouTube connected and sync completed',
    schema: {
      example: {
        channel: {
          youtubeChannelId: 'UC123456789',
          channelTitle: 'My Channel',
          subscriberCount: 10243,
          totalViewCount: 234556,
          videoCount: 58,
        },
        videosCount: 10,
        analyticsCount: 30,
        cacheStatus: 'success',
        jobId: 'job-123',
        jobStatus: 'queued',
        syncedAt: '2026-04-15T12:00:00.000Z',
        contentItemsCount: 10,
        metricsCount: 300,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing authorization code or state',
  })
  async connectYoutubeOauthCallback(
    @Query() query: YoutubeOauthCallbackQueryDto,
  ) {
    if (!query.code?.trim()) {
      throw new MissingFieldException('code');
    }
    if (!query.state?.trim()) {
      throw new MissingFieldException('state');
    }

    const metricsQuery: YoutubeMetricsQueryDto = {
      days: query.days,
      maxVideos: query.maxVideos,
    };

    return this.ingestionService.connectYoutubeOauth(
      query.code,
      query.state,
      metricsQuery,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'creator')
  @RequireAbilities('socials:youtube:write:any', 'socials:youtube:write:self')
  @ApiBearerAuth('access-token')
  @Post('permissions/approve')
  @ApiOperation({
    summary: 'Approve YouTube permissions for the connected channel',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions approved successfully',
    schema: {
      example: {
        youtubeChannelId: 'UC123456789',
        permissionsApproved: true,
        approvedAt: '2026-04-15T12:00:00.000Z',
      },
    },
  })
  async approveYoutubePermissions(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ApproveYoutubeChannelDto,
  ) {
    return this.ingestionService.approvePermissions(request.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'creator')
  @RequireAbilities('socials:youtube:write:any', 'socials:youtube:write:self')
  @ApiBearerAuth('access-token')
  @Post('approve')
  @ApiOperation({
    summary: 'Approve YouTube channel for analytics and growth tracking',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Channel approved successfully',
    schema: {
      example: {
        id: 1,
        youtubeChannelId: 'UC123456789',
        channelTitle: 'My Channel',
        isApproved: true,
        approvedAt: '2026-04-12T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
  })
  async approveYoutubeChannel(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ApproveYoutubeChannelDto,
  ) {
    return this.ingestionService.approveChannel(request.user, dto);
  }
}
