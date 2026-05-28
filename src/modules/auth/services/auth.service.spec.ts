import { AuthService } from './auth.service';
import type { AuthTokenResponseDto } from '../dto/auth-response.dto';

describe('AuthService', () => {
  it('does not overwrite stored Google integration tokens during Google login', async () => {
    const user = {
      id: 23,
      tenantId: 8,
      email: 'creator@example.com',
      name: 'Creator',
      role: 'creator',
      isActive: true,
      isEmailVerified: true,
    };
    const oauthAccount = {
      id: 7,
      userId: 23,
      provider: 'google',
      providerUserId: 'google-sub-123',
      email: 'creator@example.com',
      accessToken: 'youtube-access-token',
      refreshToken: 'youtube-refresh-token',
      tokenExpiresAt: new Date('2026-04-23T16:00:00.000Z'),
    };

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue(user),
      findByEmail: jest.fn().mockResolvedValue(null),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
      createProfile: jest.fn(),
      findTenantBySlug: jest.fn(),
      createTenant: jest.fn(),
    } as never;

    const sessionsService = {} as never;

    const authRepository = {
      findOauthAccounts: jest.fn().mockResolvedValue([oauthAccount]),
      createOauthAccount: jest.fn(),
      createAuditLog: jest.fn().mockResolvedValue(undefined),
      updateOauthAccountTokens: jest.fn(),
      upsertOauthAccountByUserProviderPurpose: jest
        .fn()
        .mockResolvedValue(undefined),
    } as never;

    const tokensService = {
      issueTokens: jest.fn().mockResolvedValue({
        user,
        accessToken: 'app-access-token',
        refreshToken: 'app-refresh-token',
        expiresIn: 900,
      } satisfies AuthTokenResponseDto),
    } as never;

    const googleOauthService = {
      exchangeGoogleAuthorizationCode: jest.fn().mockResolvedValue({
        idToken: 'google-id-token',
        accessToken: 'login-access-token',
        refreshToken: 'login-refresh-token',
        expiresAt: new Date('2026-04-23T17:00:00.000Z'),
      }),
      getGoogleLoginRedirectUri: jest
        .fn()
        .mockReturnValue(
          'http://localhost:3000/auth/socials/google/login/callback',
        ),
      verifyGoogleIdToken: jest.fn().mockResolvedValue({
        sub: 'google-sub-123',
        email: 'creator@example.com',
        name: 'Creator',
        email_verified: true,
      }),
      isGoogleInvalidGrantError: jest.fn().mockReturnValue(false),
    } as never;

    const configService = {
      get: jest.fn(),
    } as never;

    const usersCacheService = {
      deleteMe: jest.fn(),
    } as never;

    const service = new AuthService(
      usersRepository,
      sessionsService,
      authRepository,
      tokensService,
      googleOauthService,
      configService,
      usersCacheService,
    );

    const request = {
      headers: { 'user-agent': 'jest' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as never;

    const result = await service.loginWithGoogleAuthorizationCode(
      'auth-code',
      request,
      'creator',
    );

    expect(result.accessToken).toBe('app-access-token');
    expect(authRepository.updateOauthAccountTokens).not.toHaveBeenCalled();
    expect(authRepository.createOauthAccount).not.toHaveBeenCalled();
  });

  it('logs in existing Google users with their stored role even when a different role is requested', async () => {
    const user = {
      id: 23,
      tenantId: 8,
      email: 'creator@example.com',
      name: 'Creator',
      role: 'creator',
      isActive: true,
      isEmailVerified: true,
    };

    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue(user),
      findByEmail: jest.fn().mockResolvedValue(null),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
      createProfile: jest.fn(),
      getProfileByUserId: jest.fn().mockResolvedValue(null),
      findTenantBySlug: jest.fn(),
      createTenant: jest.fn(),
    } as never;

    const authRepository = {
      findOauthAccounts: jest.fn().mockResolvedValue([
        {
          id: 7,
          userId: 23,
          provider: 'google',
          purpose: 'login',
          providerUserId: 'google-sub-123',
          email: 'creator@example.com',
        },
      ]),
      createOauthAccount: jest.fn(),
      createAuditLog: jest.fn().mockResolvedValue(undefined),
      updateOauthAccountTokens: jest.fn(),
      upsertOauthAccountByUserProviderPurpose: jest
        .fn()
        .mockResolvedValue(undefined),
    } as never;

    const tokensService = {
      issueTokens: jest.fn().mockResolvedValue({
        user,
        accessToken: 'app-access-token',
        refreshToken: 'app-refresh-token',
        expiresIn: 900,
      } satisfies AuthTokenResponseDto),
    } as never;

    const googleOauthService = {
      verifyGoogleIdToken: jest.fn().mockResolvedValue({
        sub: 'google-sub-123',
        email: 'creator@example.com',
        name: 'Creator',
        email_verified: true,
      }),
    } as never;

    const service = new AuthService(
      usersRepository,
      {} as never,
      authRepository,
      tokensService,
      googleOauthService,
      {} as never,
      { deleteMe: jest.fn() } as never,
    );

    const request = {
      headers: { 'user-agent': 'jest' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as never;

    const result = await service.loginWithGoogle(
      { idToken: 'google-id-token', role: 'sme' },
      request,
    );

    expect(result.accessToken).toBe('app-access-token');
    expect(tokensService.issueTokens).toHaveBeenCalledWith(user, request);
  });
});
