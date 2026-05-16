import type { Response } from 'express';
import {
  getRefreshTokenFromRequest,
  setAuthTokenCookies,
  toPublicAuthResponse,
} from './auth-cookie.util';
import type { AuthTokenResponseDto } from '../dto/auth-response.dto';

describe('auth cookie utilities', () => {
  const authResponse: AuthTokenResponseDto = {
    user: {
      id: 1,
      email: 'creator@example.com',
      name: 'Creator',
      role: 'creator',
      tenantId: 2,
      isEmailVerified: true,
      avatarUrl: null,
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
  };

  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sets httpOnly access and refresh token cookies', () => {
    process.env.NODE_ENV = 'test';
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;

    setAuthTokenCookies(response, authResponse);

    expect(response.cookie).toHaveBeenNthCalledWith(
      1,
      'ciap_access',
      'access-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 900000,
      },
    );
    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      'ciap_refresh',
      'refresh-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 604800000,
      },
    );
  });

  it('removes token fields from public auth responses', () => {
    expect(toPublicAuthResponse(authResponse)).toEqual({
      user: authResponse.user,
      expiresIn: 900,
    });
  });

  it('reads refresh token from the auth cookie', () => {
    const request = {
      headers: {
        cookie: 'theme=dark; ciap_refresh=refresh%20token; ciap_access=access',
      },
    };

    expect(getRefreshTokenFromRequest(request as never)).toBe('refresh token');
  });
});
