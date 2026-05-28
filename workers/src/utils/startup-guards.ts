import {
  WorkerConfigurationException,
  WorkerDependencyException,
} from '../exceptions/worker.exception';

export function assertQueueName(
  value: string | undefined,
  key: string,
): string {
  if (!value?.trim()) {
    throw new WorkerConfigurationException(
      `Missing queue name for ${key}`,
      { key },
    );
  }

  return value;
}

export function classifyDependencyError(error: unknown): never {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('econnrefused') ||
      message.includes('redis') ||
      message.includes('connect')
    ) {
      throw new WorkerDependencyException(
        'Worker dependency is unavailable',
        { message: error.message },
      );
    }

    if (
      message.includes('worker_jobs') ||
      message.includes('failed query')
    ) {
      throw new WorkerDependencyException(
        'Worker database is not ready. Apply migrations before starting workers.',
        { message: error.message },
      );
    }
  }

  throw new WorkerDependencyException('Worker dependency initialization failed');
}
