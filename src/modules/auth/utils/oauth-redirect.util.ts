import type { Request } from 'express';

function parseEnvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolveOriginFromRequest(request: Request): string | null {
  const originHeader = request.get('origin');
  if (originHeader) {
    return originHeader;
  }

  const refererHeader = request.get('referer');
  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin;
  } catch {
    return null;
  }
}

function matchRedirectByOrigin(
  redirects: string[],
  origin: string,
): string | null {
  for (const redirect of redirects) {
    try {
      if (new URL(redirect).origin === origin) {
        return redirect;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function resolveFrontendRedirect(request: Request): string | null {
  const redirects = parseEnvList(process.env.FRONTEND_OAUTH_REDIRECT_URI);
  if (redirects.length === 0) {
    return null;
  }

  if (redirects.length === 1) {
    return redirects[0];
  }

  const origin = resolveOriginFromRequest(request);
  if (origin) {
    const matched = matchRedirectByOrigin(redirects, origin);
    if (matched) {
      return matched;
    }
  }

  return redirects[0];
}
