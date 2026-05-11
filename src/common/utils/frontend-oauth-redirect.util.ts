import { HttpException } from '@nestjs/common';

type RedirectParamValue = string | number | boolean | null | undefined;

export function buildFrontendOauthRedirectUrl(
  baseUrl: string,
  params: Record<string, RedirectParamValue>,
): string {
  const url = new URL(baseUrl);
  const hashQuery = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hashQuery);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    hashParams.set(key, String(value));
  }

  url.hash = hashParams.toString();
  return url.toString();
}

export function encodeFrontendOauthPayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function resolveFrontendOauthError(error: unknown): {
  code: string;
  message: string;
} {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const responsePayload =
      response && typeof response === 'object'
        ? (response as {
            message?: unknown;
            details?: {
              reason?: unknown;
            };
          })
        : undefined;

    const detailReason =
      typeof responsePayload?.details?.reason === 'string'
        ? responsePayload.details.reason
        : undefined;
    const responseMessage = Array.isArray(responsePayload?.message)
      ? responsePayload?.message.find(
          (value): value is string => typeof value === 'string',
        )
      : typeof responsePayload?.message === 'string'
        ? responsePayload.message
        : undefined;

    return {
      code: detailReason ?? `http-${error.getStatus()}`,
      message: responseMessage ?? error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'unexpected-error',
      message: error.message,
    };
  }

  return {
    code: 'unexpected-error',
    message: 'Unexpected OAuth callback failure',
  };
}
