import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './drizzle/schema';

export type SharedDatabase = NodePgDatabase<typeof schema>;

function resolveMinutesEnv(
  nameMinutes: string,
  fallbackMinutes: number,
  legacyMsName?: string,
): number {
  const value = process.env[nameMinutes]?.trim();
  if (value) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (legacyMsName) {
    const legacyValue = process.env[legacyMsName]?.trim();
    if (legacyValue) {
      const parsed = Number.parseFloat(legacyValue);
      if (Number.isFinite(parsed)) {
        return parsed / 60_000;
      }
    }
  }

  return fallbackMinutes;
}

function resolveSslConfig(
  connectionString: string,
): PoolConfig['ssl'] | undefined {
  try {
    const url = new URL(connectionString);
    const sslParam = url.searchParams.get('ssl')?.toLowerCase();
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();

    if (sslParam === 'true' || sslParam === '1') {
      return { rejectUnauthorized: false };
    }

    if (!sslMode || sslMode === 'disable') {
      return undefined;
    }

    if (sslMode === 'require') {
      return { rejectUnauthorized: false };
    }

    if (sslMode === 'verify-full' || sslMode === 'verify-ca') {
      return { rejectUnauthorized: true };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function createDatabasePool(
  connectionString: string,
  config?: Partial<PoolConfig>,
): Pool {
  return new Pool({
    connectionString,
    ssl: resolveSslConfig(connectionString),
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis:
      resolveMinutesEnv(
        'DB_POOL_IDLE_TIMEOUT_MINUTES',
        0.5,
        'DB_POOL_IDLE_TIMEOUT_MS',
      ) * 60_000,
    connectionTimeoutMillis:
      resolveMinutesEnv(
        'DB_POOL_CONNECTION_TIMEOUT_MINUTES',
        0.0833,
        'DB_POOL_CONNECTION_TIMEOUT_MS',
      ) * 60_000,
    ...config,
  });
}

export function createDatabase(pool: Pool): SharedDatabase {
  return drizzle(pool, { schema });
}

export { schema };
