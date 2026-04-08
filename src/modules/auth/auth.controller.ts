import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import {
  OAuth2ProviderDto,
} from './dto/oauth2-provider.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyResponseDto } from './dto/verify-response.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    email: string;
    role: 'admin' | 'user' | 'sme' | 'creator';
    tenantId: number;
    sessionId: string;
  };
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create account' })
  @ApiResponse({
    status: 201,
    type: AuthResponseDto,
  })
  async signup(@Body() dto: SignupDto, @Req() request: Request): Promise<AuthResponseDto> {
    return this.authService.signup(dto, request);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and issue tokens' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async login(@Body() dto: LoginDto, @Req() request: Request): Promise<AuthResponseDto> {
    return this.authService.login(dto, request);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  @ApiOperation({ summary: 'Sign in/up with Google ID token' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(dto, request);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new tokens' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(dto, request);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('verify')
  @ApiOperation({ summary: 'Verify access token and session' })
  @ApiResponse({
    status: 200,
    type: VerifyResponseDto,
  })
  async verify(@Req() request: AuthenticatedRequest): Promise<VerifyResponseDto> {
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
    return this.authService.logout(request.user.id, request.user.sessionId, request);
  }

  @Public()
  @Get('oauth2/:provider')
  @ApiOperation({ summary: 'Prepare OAuth2 provider authorization flow' })
  @ApiResponse({
    status: 400,
    description: 'Provider details not fully configured yet',
  })
  async oauth2Prepare(@Param() params: OAuth2ProviderDto) {
    return this.authService.prepareOauth2(params.provider);
  }

  @Public()
  @Get('oauth2/:provider/callback')
  @ApiOperation({ summary: 'OAuth2 callback endpoint' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async oauth2Callback(
    @Param() params: OAuth2ProviderDto,
    @Query('code') code: string,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    if (params.provider !== 'google') {
      throw new BadRequestException(`${params.provider} callback is not configured`);
    }

    return this.authService.loginWithGoogleAuthorizationCode(code, request);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback endpoint' })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
  })
  async googleCallback(
    @Query('code') code: string,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogleAuthorizationCode(code, request);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
  @Roles('admin')
  @Get('roles')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List configured RBAC roles (admin-only)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        roles: ['admin', 'user', 'sme', 'creator'],
      },
    },
  })
  getRoles() {
    return {
      roles: ['admin', 'user', 'sme', 'creator'],
    };
  }
}
