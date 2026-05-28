import type { ConnectionOptions } from 'bullmq';

export function parseRedisUrl(redisUrl: string): ConnectionOptions {
  try {
    const url = new URL(redisUrl);
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
      throw new Error(`Unsupported Redis protocol: ${url.protocol}`);
    }

    return {
      host: url.hostname,
      port: url.port ? Number.parseInt(url.port, 10) : 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      db: parseRedisDbIndex(url),
      ...(url.protocol === 'rediss:'
        ? {
            tls: {
              servername: url.hostname,
            },
          }
        : {}),
    } satisfies ConnectionOptions;
  } catch (error) {
    throw new Error(
      `Invalid REDIS_URL format: ${redisUrl}${error instanceof Error ? ` (${error.message})` : ''}`,
    );
  }
}

function parseRedisDbIndex(url: URL): number {
  const pathname = url.pathname.replace(/^\/+/, '');
  if (!pathname) {
    return 0;
  }

  const parsed = Number.parseInt(pathname, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Redis database index must be a non-negative integer');
  }

  return parsed;
}
