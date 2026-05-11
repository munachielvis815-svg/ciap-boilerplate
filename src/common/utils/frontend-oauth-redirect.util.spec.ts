import { BadRequestException } from '@nestjs/common';
import {
  buildFrontendOauthRedirectUrl,
  encodeFrontendOauthPayload,
  resolveFrontendOauthError,
} from './frontend-oauth-redirect.util';

describe('frontend-oauth-redirect.util', () => {
  it('builds a fragment-based frontend redirect URL', () => {
    const result = buildFrontendOauthRedirectUrl(
      'http://localhost:5173/auth/callback/google?source=oauth',
      {
        status: 'success',
        provider: 'google',
        ignored: undefined,
      },
    );

    expect(result).toBe(
      'http://localhost:5173/auth/callback/google?source=oauth#status=success&provider=google',
    );
  });

  it('encodes callback payload to base64url JSON', () => {
    const encoded = encodeFrontendOauthPayload({
      accessToken: 'token-1',
      role: 'creator',
    });

    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as {
      accessToken: string;
      role: string;
    };

    expect(decoded).toEqual({
      accessToken: 'token-1',
      role: 'creator',
    });
  });

  it('extracts stable details from HttpException errors', () => {
    const error = new BadRequestException({
      message: 'Missing code',
      details: {
        reason: 'missing-code',
      },
    });

    expect(resolveFrontendOauthError(error)).toEqual({
      code: 'missing-code',
      message: 'Missing code',
    });
  });
});
