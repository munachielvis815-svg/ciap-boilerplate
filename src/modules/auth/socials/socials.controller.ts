import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiExcludeEndpoint,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { MissingFieldException } from '@common/exceptions';
import { Public, RequireAbilities, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { AuthenticatedRequest } from '@/types/express';
import {
  buildFrontendOauthRedirectUrl,
  encodeFrontendOauthPayload,
  resolveFrontendOauthError,
} from '@utils/frontend-oauth-redirect.util';
import { YoutubeMetricsQueryDto } from './dto/youtube-metrics-query.dto';
import { GoogleOauthLoginQueryDto } from './dto/google-oauth-login-query.dto';
import { SocialsService } from './socials.service';

@ApiTags('auth-socials')
@Controller('auth/socials')
export class SocialsController {
  constructor(
    private readonly socialsService: SocialsService,
    private readonly configService: ConfigService,
  ) {}

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
    summary: 'Prepare Google OAuth2 authorization flow for login(Client)',
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
  @ApiOperation({ summary: 'Google OAuth2 login callback endpoint (Internal)' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend callback route with result payload.',
  })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.redirectGoogleLoginCallback(code, state, request, response);
  }

  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async legacyGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.redirectGoogleLoginCallback(code, state, request, response);
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

  private async redirectGoogleLoginCallback(
    code: string,
    state: string | undefined,
    request: Request,
    response: Response,
  ): Promise<void> {
    const frontendCallbackUrl = this.getGoogleLoginFrontendCallbackUrl();

    try {
      const authResponse = await this.handleGoogleLoginCallback(
        code,
        state,
        request,
      );
      const redirectUrl = buildFrontendOauthRedirectUrl(frontendCallbackUrl, {
        status: 'success',
        provider: 'google',
        purpose: 'login',
        payload: encodeFrontendOauthPayload(authResponse),
      });
      response.redirect(HttpStatus.FOUND, redirectUrl);
      return;
    } catch (error) {
      const oauthError = resolveFrontendOauthError(error);
      const redirectUrl = buildFrontendOauthRedirectUrl(frontendCallbackUrl, {
        status: 'error',
        provider: 'google',
        purpose: 'login',
        errorCode: oauthError.code,
        errorMessage: oauthError.message,
      });
      response.redirect(HttpStatus.FOUND, redirectUrl);
      return;
    }
  }

  private getGoogleLoginFrontendCallbackUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_GOOGLE_LOGIN_CALLBACK_URL') ||
      'http://localhost:5173/auth/callback/google'
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'sme', 'creator')
  @RequireAbilities('socials:oauth:refresh:any', 'socials:oauth:refresh:self')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @Post('google/token/refresh')
  @ApiOperation({
    summary: 'Refresh stored Google OAuth access token for current user(Dev)',
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
    summary:
      'Pull YouTube channel, latest 10 videos, and analytics metrics(Dev)',
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
        demographicsStatus: 'success',
        demographicsWarning: null,
        limits: {
          days: 30,
          maxVideos: 10,
        },
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
        bullmq: {
          queue: 'youtube',
          jobName: 'youtube.ingestion',
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
    const result = await this.socialsService.getYoutubeMetrics(
      request.user,
      query,
    );

    if (Array.isArray(result.comments)) {
      result.comments = result.comments.map((entry) => ({
        ...entry,
        topComments: [],
        latestComments: [],
      }));
    }

    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin', 'sme', 'creator')
  @RequireAbilities('socials:youtube:read:any', 'socials:youtube:read:self')
  @ApiBearerAuth('access-token')
  @Get('google/youtube/metrics/job-payload')
  @ApiOperation({
    summary:
      'Prepare BullMQ payload contract for YouTube metrics pull (no enqueue, Internal)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        queue: 'youtube',
        jobName: 'youtube.ingestion',
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
