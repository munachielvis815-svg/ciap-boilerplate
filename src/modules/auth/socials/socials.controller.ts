import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { MissingFieldException } from '@common/exceptions';
import { Public, RequireAbilities, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { AuthenticatedRequest } from '@/types/express';
import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { GoogleAuthDto } from '@modules/auth/dto/google-auth.dto';
import { YoutubeMetricsQueryDto } from './dto/youtube-metrics-query.dto';
import { SocialsService } from './socials.service';

@ApiTags('auth-socials')
@Controller('auth/socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  @ApiOperation({
    summary: 'Sign in/up with Google ID token (social auth flow)',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.socialsService.loginWithGoogle(dto, request);
  }

  @Public()
  @Get('oauth2/google')
  @ApiOperation({
    summary: 'Prepare Google OAuth2 authorization flow with YouTube scopes',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        provider: 'google',
        redirectUri: 'http://localhost:3000/auth/socials/google/callback',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      },
    },
  })
  async oauth2PrepareGoogle() {
    return this.socialsService.prepareGoogleOauth2();
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth2 callback endpoint' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing authorization code',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired Google authorization code',
  })
  async googleCallback(
    @Query('code') code: string,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    if (!code?.trim()) {
      throw new MissingFieldException('code');
    }

    return this.socialsService.loginWithGoogleAuthorizationCode(code, request);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'user', 'sme', 'creator')
  @RequireAbilities('socials:oauth:refresh:any', 'socials:oauth:refresh:self')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @Post('google/token/refresh')
  @ApiOperation({
    summary: 'Refresh stored Google OAuth access token for current user',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        tokenExpiresAt: '2026-04-09T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Google OAuth account missing or token refresh failed',
  })
  async refreshGoogleToken(@Req() request: AuthenticatedRequest) {
    return this.socialsService.refreshGoogleOauthTokens(request.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'user', 'sme', 'creator')
  @RequireAbilities('socials:youtube:read:any', 'socials:youtube:read:self')
  @ApiBearerAuth('access-token')
  @Get('google/youtube/metrics')
  @ApiOperation({
    summary: 'Pull YouTube channel, latest video, and analytics metrics',
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
    example: 20,
  })
  @ApiHeader({
    name: 'x-google-access-token',
    required: false,
    description:
      'Optional Google OAuth access token. If omitted, stored token for the authenticated app user is used.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        channel: {
          id: 'UC123456789',
          statistics: {
            subscriberCount: '10243',
            viewCount: '234556',
            videoCount: '58',
          },
        },
        videos: [
          {
            id: 'abc123',
            snippet: { title: 'Latest video' },
            statistics: { viewCount: '1234' },
          },
        ],
        analytics: {
          columnHeaders: [{ name: 'day' }, { name: 'views' }],
          rows: [
            ['2026-04-01', 120],
            ['2026-04-02', 145],
          ],
        },
        limits: {
          days: 30,
          maxVideos: 20,
        },
        bullmq: {
          queue: 'youtube-metrics',
          jobName: 'youtube-metrics.pull',
          payload: {
            provider: 'google',
            userId: 7,
            tenantId: 3,
            days: 30,
            maxVideos: 20,
            requestedAt: '2026-04-09T10:00:00.000Z',
          },
        },
      },
    },
  })
  async getYoutubeMetrics(
    @Req() request: AuthenticatedRequest,
    @Query() query: YoutubeMetricsQueryDto,
    @Headers('x-google-access-token') googleAccessToken?: string,
  ) {
    return this.socialsService.getYoutubeMetrics(
      request.user,
      query,
      googleAccessToken,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'user', 'sme', 'creator')
  @RequireAbilities('socials:youtube:read:any', 'socials:youtube:read:self')
  @ApiBearerAuth('access-token')
  @Get('google/youtube/metrics/job-payload')
  @ApiOperation({
    summary:
      'Prepare BullMQ payload contract for YouTube metrics pull (no enqueue)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        queue: 'youtube-metrics',
        jobName: 'youtube-metrics.pull',
        payload: {
          provider: 'google',
          userId: 7,
          tenantId: 3,
          days: 30,
          maxVideos: 20,
          requestedAt: '2026-04-09T10:00:00.000Z',
        },
      },
    },
  })
  async getYoutubeMetricsJobPayload(
    @Req() request: AuthenticatedRequest,
    @Query() query: YoutubeMetricsQueryDto,
  ) {
    return this.socialsService.getYoutubeMetricsJobPayload(request.user, query);
  }
}
