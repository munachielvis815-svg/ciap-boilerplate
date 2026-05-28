import Fastify from 'fastify';
import { StructuredLogger } from '@shared/logging/structured-logger';
import type { WorkerEnv } from './config/worker-env';
import { registerHealthRoutes } from './routes/health-routes';
import { WorkerQueueRuntimeService } from './services/worker-queue-runtime.service';
import { toWorkerException } from './exceptions/worker.exception';

export async function createWorkerApp(env: WorkerEnv) {
  const app = Fastify({
    logger: false,
  });
  const logger = new StructuredLogger('WorkerApp');
  const runtime = new WorkerQueueRuntimeService(env);

  app.setErrorHandler((error, request, reply) => {
    const normalized = toWorkerException(error);
    logger.error({
      message: 'Worker request failed',
      requestId:
        typeof request.headers['x-request-id'] === 'string'
          ? request.headers['x-request-id']
          : null,
      error: normalized,
      data: {
        url: request.url,
        method: request.method,
        code: normalized.code,
      },
    });

    void reply.status(normalized.statusCode).send({
      error: normalized.name,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details ?? null,
    });
  });

  await registerHealthRoutes(app, runtime);

  app.addHook('onReady', async () => {
    void runtime
      .start()
      .then(() => {
        logger.info({
          message: 'Worker runtime started',
          data: {
            port: env.port,
          },
        });
      })
      .catch((error) => {
        logger.error({
          message: 'Worker runtime failed to start',
          error,
        });
        process.exitCode = 1;
        void app.close();
      });
  });

  app.addHook('onClose', async () => {
    await runtime.stop();
  });

  return app;
}
