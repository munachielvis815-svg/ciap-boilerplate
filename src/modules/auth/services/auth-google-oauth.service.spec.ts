import type { ConfigService } from '@nestjs/config';
import type { RequestUser } from '@/types';
import {
  AuthGoogleOauthService,
  GOOGLE_YOUTUBE_CONNECT_SCOPES,
} from './auth-google-oauth.service';

describe('AuthGoogleOauthService', () => {
  it('requests the comment-capable YouTube scopes for youtube connect', () => {
    const service = new AuthGoogleOauthService(
      {} as never,
      {} as never,
      {} as never,
      {} as ConfigService,
    );

    const generateAuthUrl = jest
      .fn()
      .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth');

    jest
      .spyOn(service as never, 'getGoogleClient')
      .mockReturnValue({ generateAuthUrl } as never);
    jest
      .spyOn(service as never, 'buildOauthState')
      .mockReturnValue('signed-state');
    jest
      .spyOn(service as never, 'getGoogleYoutubeRedirectUri')
      .mockReturnValue(
        'http://localhost:3000/ingestion/youtube/oauth2/callback',
      );

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'oauth-connect',
    };

    service.prepareGoogleOauth('google', {
      purpose: 'youtube-connect',
      actor,
    });

    expect(generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        scope: expect.arrayContaining([
          'openid',
          'email',
          'profile',
          ...GOOGLE_YOUTUBE_CONNECT_SCOPES,
        ]),
        state: 'signed-state',
      }),
    );
  });

  it('stores youtube connect grants under the youtube-connect purpose', async () => {
    const authRepository = {
      findOauthAccounts: jest.fn().mockResolvedValue([]),
      findOauthAccountByUserAndProvider: jest.fn().mockResolvedValue(null),
      createOauthAccount: jest.fn().mockResolvedValue(undefined),
      updateOauthAccountTokens: jest.fn(),
    } as never;

    const service = new AuthGoogleOauthService(
      {} as never,
      authRepository,
      {} as never,
      {} as ConfigService,
    );

    jest
      .spyOn(service as never, 'exchangeGoogleAuthorizationCode')
      .mockResolvedValue({
        idToken: 'google-id-token',
        accessToken: 'youtube-access-token',
        refreshToken: 'youtube-refresh-token',
        expiresAt: new Date('2026-05-07T10:00:00.000Z'),
      });
    jest.spyOn(service as never, 'resolveGoogleIdentity').mockResolvedValue({
      providerUserId: 'google-sub-123',
      email: 'creator@example.com',
    });
    jest
      .spyOn(service as never, 'getGoogleYoutubeRedirectUri')
      .mockReturnValue(
        'http://localhost:3000/ingestion/youtube/oauth2/callback',
      );

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'oauth-connect',
    };

    await service.connectGoogleYoutubeAuthorizationCode('auth-code', actor);

    expect(authRepository.createOauthAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actor.id,
        provider: 'google',
        purpose: 'youtube-connect',
        providerUserId: 'google-sub-123',
      }),
    );
  });

  it('disconnects the youtube-connect grant for the current user', async () => {
    const usersRepository = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 23,
        tenantId: 8,
      }),
    } as never;

    const authRepository = {
      deleteOauthAccountByUserAndProvider: jest
        .fn()
        .mockResolvedValue(undefined),
    } as never;

    const service = new AuthGoogleOauthService(
      usersRepository,
      authRepository,
      {} as never,
      {} as ConfigService,
    );

    const actor: RequestUser = {
      id: 23,
      email: 'creator@example.com',
      role: 'creator',
      tenantId: 8,
      sessionId: 'oauth-connect',
    };

    const result = await service.disconnectGoogleYoutubeForUser(23, actor);

    expect(
      authRepository.deleteOauthAccountByUserAndProvider,
    ).toHaveBeenCalledWith(23, 'google', 'youtube-connect');
    expect(result).toEqual({ success: true });
  });
});
