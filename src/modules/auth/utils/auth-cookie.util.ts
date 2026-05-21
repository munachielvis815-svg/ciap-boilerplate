import type { Request, Response } from 'express';
import type {
  AuthResponseDto,
  AuthTokenResponseDto,
} from '../dto/auth-response.dto';

const ACCESS_COOKIE_NAME = 'ciap_access';
const REFRESH_COOKIE_NAME = 'ciap_refresh';
const DEFAULT_REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthTokenCookies(
  response: Response,
  authResponse: AuthTokenResponseDto,
): void {
  const secure = process.env.NODE_ENV === 'production';
  const sameSiteEnv = process.env.AUTH_COOKIE_SAMESITE?.toLowerCase();
  const sameSite =
    sameSiteEnv === 'none' || sameSiteEnv === 'lax' || sameSiteEnv === 'strict'
      ? sameSiteEnv
      : secure
        ? 'none'
        : 'lax';

  response.cookie(ACCESS_COOKIE_NAME, authResponse.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: authResponse.expiresIn * 1000,
  });

  response.cookie(REFRESH_COOKIE_NAME, authResponse.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: DEFAULT_REFRESH_MAX_AGE_MS,
  });
}

export function toPublicAuthResponse(
  authResponse: AuthTokenResponseDto,
): AuthResponseDto {
  return {
    user: authResponse.user,
    expiresIn: authResponse.expiresIn,
  };
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookies = request.headers.cookie;
  if (!cookies) {
    return null;
  }

  const refreshCookie = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));

  if (!refreshCookie) {
    return null;
  }

  const rawValue = refreshCookie.slice(REFRESH_COOKIE_NAME.length + 1);
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}
