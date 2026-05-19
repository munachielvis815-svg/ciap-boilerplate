import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, RequireAbilities, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { Request, Response } from 'express';
import { MissingFieldException } from '@common/exceptions';
import type { AuthenticatedRequest } from '@/types/express';
import { AuthService } from '../services/auth.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import {
  getRefreshTokenFromRequest,
  setAuthTokenCookies,
  toPublicAuthResponse,
} from '../utils/auth-cookie.util';
import { AdminSignupDto } from '../dto/admin-signup.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SignupDto } from '../dto/signup.dto';
import { VerifyResponseDto } from '../dto/verify-response.dto';
import { UpdatePasswordDto } from '@modules/users/dto/update-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'Create account',
    description:
      'Sets ciap_access and ciap_refresh httpOnly cookies. The JSON response omits raw token fields.',
  })
  @ApiResponse({
    status: 201,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failure or unsupported role selection',
  })
  async signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.signup(dto, request);
    setAuthTokenCookies(response, result);
    return toPublicAuthResponse(result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user and issue tokens',
    description:
      'Sets ciap_access and ciap_refresh httpOnly cookies. The JSON response omits raw token fields.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or admin login attempted on public route',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, request);
    setAuthTokenCookies(response, result);
    return toPublicAuthResponse(result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin/signup')
  @ApiOperation({
    summary: 'Create platform admin account (separate protected flow)',
    description:
      'Sets ciap_access and ciap_refresh httpOnly cookies. The JSON response omits raw token fields.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid admin signup key',
  })
  async adminSignup(
    @Body() dto: AdminSignupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.adminSignup(dto, request);
    setAuthTokenCookies(response, result);
    return toPublicAuthResponse(result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  @ApiOperation({
    summary: 'Authenticate platform admin (separate from public login)',
    description:
      'Sets ciap_access and ciap_refresh httpOnly cookies. The JSON response omits raw token fields.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or non-admin account',
  })
  async adminLogin(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.adminLogin(dto, request);
    setAuthTokenCookies(response, result);
    return toPublicAuthResponse(result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token and issue new tokens',
    description:
      'Reads ciap_refresh from an httpOnly cookie when the body token is absent. Rotates ciap_access and ciap_refresh cookies and omits raw token fields from JSON.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken =
      dto.refreshToken ?? getRefreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new MissingFieldException('refreshToken');
    }

    const result = await this.authService.refresh({ refreshToken }, request);
    setAuthTokenCookies(response, result);
    return toPublicAuthResponse(result);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('verify')
  @ApiOperation({ summary: 'Verify access token and session' })
  @ApiResponse({
    status: 200,
    type: VerifyResponseDto,
  })
  async verify(
    @Req() request: AuthenticatedRequest,
  ): Promise<VerifyResponseDto> {
    return this.authService.verifySession(
      request.user.id,
      request.user.tenantId,
      request.user.sessionId,
      request.user.email,
      request.user.role,
      request,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
      },
    },
  })
  async logout(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.authService.logout(
      request.user.id,
      request.user.sessionId,
      request,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Patch('me/password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Set or change the authenticated user's password" })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ success: true }> {
    return this.authService.updatePassword(request.user, dto);
  }

  /**
   * Backward-compatibility alias for older Google OAuth callback URL.
   * Preferred route is /auth/socials/google/callback.
   */
  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async legacyGoogleCallback(
    @Query('code') code: string,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto | void> {
    if (!code?.trim()) {
      throw new MissingFieldException('code');
    }

    const result = await this.authService.loginWithGoogleAuthorizationCode(
      code,
      request,
    );

    setAuthTokenCookies(res, result);
    const frontendRedirect = process.env.FRONTEND_OAUTH_REDIRECT_URI;
    if (frontendRedirect) {
      return res.redirect(frontendRedirect);
    }

    return toPublicAuthResponse(result);
  }

  /**
   * Backward-compatibility alias for older OAuth2 prepare route.
   * Preferred route is /auth/socials/oauth2/google.
   */
  @Public()
  @Get('oauth2/google')
  @ApiExcludeEndpoint()
  legacyOauth2PrepareGoogle() {
    return this.authService.prepareOauth2('google');
  }

  /**
   * Backward-compatibility alias for older OAuth2 callback route.
   * Preferred route is /auth/socials/google/callback.
   */
  @Public()
  @Get('oauth2/google/callback')
  @ApiExcludeEndpoint()
  async legacyOauth2GoogleCallback(
    @Query('code') code: string,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto | void> {
    if (!code?.trim()) {
      throw new MissingFieldException('code');
    }
    const result = await this.authService.loginWithGoogleAuthorizationCode(
      code,
      request,
    );

    setAuthTokenCookies(res, result);
    const frontendRedirect = process.env.FRONTEND_OAUTH_REDIRECT_URI;
    if (frontendRedirect) {
      return res.redirect(frontendRedirect);
    }

    return toPublicAuthResponse(result);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin')
  @RequireAbilities('auth:manage:any')
  @Get('roles')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List configured RBAC roles (admin-only)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        roles: ['admin', 'sme', 'creator'],
      },
    },
  })
  getRoles() {
    return {
      roles: ['admin', 'sme', 'creator'],
    };
  }
}
