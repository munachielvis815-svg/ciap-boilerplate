import type { FastifyInstance } from 'fastify';
import { WorkerQueueRuntimeService } from '../services/worker-queue-runtime.service';

export async function registerHealthRoutes(
  app: FastifyInstance,
  runtime: WorkerQueueRuntimeService,
): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    queues: await runtime.getHealth(),
  }));
}
