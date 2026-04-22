import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiBearerAuth,
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
import { YoutubeMetricsQueryDto } from './dto/youtube-metrics-query.dto';
import { GoogleOauthLoginQueryDto } from './dto/google-oauth-login-query.dto';
import { SocialsService } from './socials.service';

@ApiTags('auth-socials')
@Controller('auth/socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) {}

  @Public()
  @HttpCode(HttpStatus.GONE)
  @Post('google')
  @ApiExcludeEndpoint()
  deprecatedGoogleIdTokenLogin() {
    return {
      message:
        'Deprecated. Use /auth/socials/oauth2/google/login to sign in with Google OAuth.',
    };
  }

  @Public()
  @Get('oauth2/google/login')
  @ApiOperation({
    summary: 'Prepare Google OAuth2 authorization flow for login',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['sme', 'creator'],
    example: 'creator',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        provider: 'google',
        redirectUri: 'http://localhost:3000/auth/socials/google/login/callback',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        purpose: 'login',
      },
    },
  })
  oauth2PrepareGoogleLogin(@Query() query: GoogleOauthLoginQueryDto) {
    return this.socialsService.prepareGoogleOauth2Login(query.role);
  }

  @Public()
  @Get('oauth2/google')
  @ApiExcludeEndpoint()
  legacyOauth2PrepareGoogle() {
    return this.socialsService.prepareGoogleOauth2Login();
  }

  @Public()
  @Get('google/login/callback')
  @ApiOperation({ summary: 'Google OAuth2 login callback endpoint' })
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
    @Query('state') state: string | undefined,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.handleGoogleLoginCallback(code, state, request);
  }

  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async legacyGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.handleGoogleLoginCallback(code, state, request);
  }

  private handleGoogleLoginCallback(
    code: string,
    state: string | undefined,
    request: Request,
  ) {
    if (!code?.trim()) {
      throw new MissingFieldException('code');
    }

    return this.socialsService.loginWithGoogleAuthorizationCode(
      code,
      request,
      state,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'sme', 'creator')
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
  @Roles('admin', 'sme', 'creator')
  @RequireAbilities('socials:youtube:read:any', 'socials:youtube:read:self')
  @ApiBearerAuth('access-token')
  @Get('google/youtube/metrics')
  @ApiOperation({
    summary: 'Pull YouTube channel, latest 10 videos, and analytics metrics',
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
        analyticsStatus: 'success',
        analyticsWarning: null,
        limits: {
          days: 30,
          maxVideos: 10,
        },
        bullmq: {
          queue: 'youtube-metrics',
          jobName: 'youtube-metrics.pull',
          payload: {
            provider: 'google',
            userId: 7,
            tenantId: 3,
            days: 30,
            maxVideos: 10,
            requestedAt: '2026-04-09T10:00:00.000Z',
          },
        },
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
    return this.socialsService.getYoutubeMetrics(request.user, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'sme', 'creator')
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
  getYoutubeMetricsJobPayload(
    @Req() request: AuthenticatedRequest,
    @Query() query: YoutubeMetricsQueryDto,
  ) {
    return this.socialsService.getYoutubeMetricsJobPayload(request.user, query);
  }
}
