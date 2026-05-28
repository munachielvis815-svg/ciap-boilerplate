export type WorkerEnv = {
  host: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  bullPrefix: string;
  schedulerEnabled: boolean;
  exitOnIdle: boolean;
  idleTimeoutMs: number;
  maxRetries: number;
  backoffDelayMs: number;
  youtubeSyncBatchScheduleMs: number;
  mlScheduleMs: number;
  youtubeSyncStaleAfterMinutes: number;
  youtubeSyncBatchSize: number;
  youtubeSyncBatchConcurrency: number;
  youtubeSyncConcurrency: number;
  mlConcurrency: number;
  googleClientId: string;
  googleClientSecret: string;
  googleApiTimeoutMs: number;
  mlBaseUrl: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function getNumberEnv(name: string, fallback: number): number {
  const value = process.env[name]?.trim();
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getMinutesEnv(
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

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) {
    return fallback;
  }

  if (value === 'true' || value === '1' || value === 'yes') {
    return true;
  }

  if (value === 'false' || value === '0' || value === 'no') {
    return false;
  }

  return fallback;
}

export function loadWorkerEnv(): WorkerEnv {
  return {
    host: process.env.WORKER_HOST?.trim() || '0.0.0.0',
    port: getNumberEnv('WORKER_PORT', 3001),
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    redisUrl: getRequiredEnv('REDIS_URL'),
    bullPrefix: process.env.BULLMQ_PREFIX?.trim() || 'Queue',
    schedulerEnabled: getBooleanEnv('WORKER_SCHEDULER_ENABLED', true),
    exitOnIdle: getBooleanEnv('WORKER_EXIT_ON_IDLE', false),
    idleTimeoutMs:
      getMinutesEnv('WORKER_IDLE_TIMEOUT_MINUTES', 1, 'WORKER_IDLE_TIMEOUT_MS') *
      60_000,
    maxRetries: getNumberEnv('BULLMQ_MAX_RETRIES', 3),
    backoffDelayMs:
      getMinutesEnv('BULLMQ_BACKOFF_DELAY_MINUTES', 0.05, 'BULLMQ_BACKOFF_DELAY_MS') *
      60_000,
    youtubeSyncBatchScheduleMs:
      getMinutesEnv('YOUTUBE_SYNC_BATCH_SCHEDULE_MINUTES', 5, 'YOUTUBE_SYNC_BATCH_SCHEDULE_MS') *
      60_000,
    mlScheduleMs:
      getMinutesEnv('ML_INFERENCING_SCHEDULE_MINUTES', 15, 'ML_INFERENCING_SCHEDULE_MS') *
      60_000,
    youtubeSyncStaleAfterMinutes: getNumberEnv(
      'YOUTUBE_SYNC_STALE_AFTER_MINUTES',
      60,
    ),
    youtubeSyncBatchSize: getNumberEnv('YOUTUBE_SYNC_BATCH_SIZE', 25),
    youtubeSyncBatchConcurrency: getNumberEnv(
      'WORKER_BATCH_CONCURRENCY',
      1,
    ),
    youtubeSyncConcurrency: getNumberEnv('WORKER_SYNC_CONCURRENCY', 5),
    mlConcurrency: getNumberEnv('WORKER_ML_CONCURRENCY', 1),
    googleClientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    googleApiTimeoutMs:
      getMinutesEnv('GOOGLE_API_TIMEOUT_MINUTES', 0.17, 'GOOGLE_API_TIMEOUT_MS') *
      60_000,
    mlBaseUrl: process.env.ML_BASE_URL?.trim() || 'http://localhost:8080',
  };
}
