import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  Query,
  Req,
  Res,
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
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/types/express';
import { YoutubeMetricsQueryDto } from '@modules/auth/socials/dto/youtube-metrics-query.dto';
import { resolveFrontendRedirect } from '@modules/auth/utils/oauth-redirect.util';
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
      'Pull authenticated user YouTube channel, latest 10 videos, and analytics(Internal)',
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
        comments: [
          {
            videoId: 'abc123',
            commentCount: 42,
            sampleComments: [
              {
                commentId: 'comment-1',
                textDisplay: 'Great video!',
                authorDisplayName: 'Viewer One',
                likeCount: 3,
                publishedAt: '2026-04-01T12:00:00.000Z',
                commentType: 'top',
              },
            ],
          },
        ],
        demographics: {
          ageGroups: [{ ageGroup: '18-24', viewerPercentage: 0.32 }],
          genders: [{ gender: 'female', viewerPercentage: 0.48 }],
          countries: [{ country: 'US', viewerPercentage: 0.22 }],
          startDate: '2026-03-10',
          endDate: '2026-04-08',
        },
        demographicsCount: 3,
        videosCount: 1,
        commentsCount: 70,
        analyticsCount: 30,
        cacheStatus: 'warning',
        jobId: 'job-123',
        jobStatus: 'queued',
        syncedAt: '2026-04-15T12:00:00.000Z',
        contentItemsCount: 1,
        metricsCount: 300,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No YouTube channel found for this account',
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
    summary:
      'Prepare Google OAuth2 flow to connect YouTube for creators(Client)',
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
    summary:
      'Google OAuth2 callback for YouTube connect and immediate sync(Internal)',
    description:
      'Runs the ingestion sync, then redirects to the configured frontend OAuth redirect URI when available.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to the frontend OAuth completion URL',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'YouTube connected and sync completed without a redirect URL',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing authorization code or state',
  })
  async connectYoutubeOauthCallback(
    @Query() query: YoutubeOauthCallbackQueryDto,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
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

    try {
      await this.ingestionService.connectYoutubeOauth(
        query.code,
        query.state,
        metricsQuery,
      );

      const frontendRedirect = resolveFrontendRedirect(request);
      if (frontendRedirect) {
        return res.redirect(frontendRedirect);
      }

      return res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      const frontendRedirect = resolveFrontendRedirect(request);
      if (frontendRedirect) {
        try {
          const url = new URL(frontendRedirect);
          url.searchParams.set(
            'error',
            error instanceof Error ? error.message : 'youtube_connect_failed',
          );
          return res.redirect(url.toString());
        } catch {
          return res.redirect(
            `${frontendRedirect}?error=youtube_connect_failed`,
          );
        }
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'creator')
  @RequireAbilities('socials:youtube:write:any', 'socials:youtube:write:self')
  @ApiBearerAuth('access-token')
  @Post('permissions/approve')
  @ApiOperation({
    summary: 'Approve YouTube permissions for the connected channel(Internal)',
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
    summary:
      'Approve YouTube channel for analytics and growth tracking(Internal)',
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
