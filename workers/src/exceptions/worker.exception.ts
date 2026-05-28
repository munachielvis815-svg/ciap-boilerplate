export class WorkerException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class WorkerConfigurationException extends WorkerException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'worker_configuration_error', 500, details);
  }
}

export class WorkerDependencyException extends WorkerException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'worker_dependency_error', 503, details);
  }
}

export class WorkerRuntimeException extends WorkerException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'worker_runtime_error', 500, details);
  }
}

export function toWorkerException(error: unknown): WorkerException {
  if (error instanceof WorkerException) {
    return error;
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return new WorkerRuntimeException(error.message, {
      name: error.name,
      stack: error.stack,
      cause: cause instanceof Error
        ? {
            name: cause.name,
            message: cause.message,
            stack: cause.stack,
          }
        : cause
          ? String(cause)
          : null,
    });
  }

  return new WorkerRuntimeException('Unexpected worker error', {
    value: String(error),
  });
}
