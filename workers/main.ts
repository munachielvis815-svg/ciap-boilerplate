import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { StructuredLogger } from '@shared/logging/structured-logger';
import { createWorkerApp } from './src/app';
import { loadWorkerEnv } from './src/config/worker-env';
import { toWorkerException } from './src/exceptions/worker.exception';

loadEnv({ path: resolve(process.cwd(), '..', '.env') });
loadEnv();

const logger = new StructuredLogger('WorkerMain');

function logFatalError(message: string, error: unknown): void {
  const normalized = toWorkerException(error);
  logger.error({
    message,
    error: normalized,
    data: {
      code: normalized.code,
      details: normalized.details ?? null,
    },
  });
}

async function bootstrap(): Promise<void> {
  const env = loadWorkerEnv();
  const app = await createWorkerApp(env);

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    logFatalError('Worker bootstrap failed', error);
    process.exitCode = 1;
  }
}

process.on('unhandledRejection', (error) => {
  logFatalError('Unhandled worker rejection', error);
});

process.on('uncaughtException', (error) => {
  logFatalError('Uncaught worker exception', error);
  process.exit(1);
});

void bootstrap();
