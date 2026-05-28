type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  component: string;
  message: string;
  requestId?: string | null;
  jobId?: string | null;
  userId?: number | null;
  queue?: string | null;
  data?: Record<string, unknown> | null;
  error?: unknown;
};

const LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (raw === 'debug' || raw === 'warn' || raw === 'error') {
    return raw;
  }

  return 'info';
}

function resolveLogFormat(): 'json' | 'pretty' {
  const raw = process.env.LOG_FORMAT?.trim().toLowerCase();
  return raw === 'pretty' ? 'pretty' : 'json';
}

function resolveLogColor(): boolean {
  if (resolveLogFormat() !== 'pretty') {
    return false;
  }

  if (process.env.NO_COLOR) {
    return false;
  }

  const raw = process.env.LOG_COLOR?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') {
    return false;
  }
  if (raw === 'true' || raw === '1' || raw === 'yes') {
    return true;
  }

  return true;
}

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(value: string, color: keyof typeof ANSI): string {
  if (!resolveLogColor()) {
    return value;
  }

  return `${ANSI[color]}${value}${ANSI.reset}`;
}

function safeJsonStringify(value: unknown): string {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_key, current: unknown) => {
      if (typeof current === 'bigint') {
        return current.toString();
      }

      if (typeof current === 'symbol') {
        return current.toString();
      }

      if (typeof current === 'function') {
        const name = current.name;
        return `[Function${name ? ` ${name}` : ''}]`;
      }

      if (typeof current === 'object' && current !== null) {
        const obj = current;
        if (seen.has(obj)) {
          return '[Circular]';
        }
        seen.add(obj);
      }

      return current;
    });

    if (json !== undefined) {
      return json;
    }

    if (value === null) {
      return 'null';
    }

    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
      case 'boolean':
      case 'bigint':
      case 'symbol':
      case 'undefined':
        return String(value);
      case 'function': {
        const name = value.name;
        return `[Function${name ? ` ${name}` : ''}]`;
      }
      case 'object':
        return Object.prototype.toString.call(value);
    }
  } catch {
    // ignore
  }

  return Object.prototype.toString.call(value);
}

function serializeCause(
  cause: unknown,
): Record<string, unknown> | string | null {
  if (cause === null || cause === undefined) {
    return null;
  }

  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };
  }

  switch (typeof cause) {
    case 'string':
      return cause;
    case 'object':
      return { value: safeJsonStringify(cause) };
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
    case 'undefined':
      return { value: String(cause) };
    case 'function': {
      const name = cause.name;
      return { value: `[Function${name ? ` ${name}` : ''}]` };
    }
  }
}

function serializeError(error: unknown): Record<string, unknown> | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const response = (
    error as Error & {
      response?: { status?: number; data?: unknown };
      code?: string;
    }
  ).response;
  const responseData = response?.data;
  const responsePayload =
    response && typeof response?.status === 'number'
      ? {
          status: response.status,
          data: sanitizeResponseData(responseData),
        }
      : null;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: (error as Error & { code?: string }).code,
    response: responsePayload,
    cause: serializeCause((error as Error & { cause?: unknown }).cause),
  };
}

function sanitizeResponseData(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data ?? null;
  }

  const redactedKeys = new Set([
    'access_token',
    'refresh_token',
    'id_token',
    'client_secret',
  ]);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = redactedKeys.has(key) ? '[redacted]' : value;
  }

  return result;
}

function formatPretty(payload: {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  requestId: string | null;
  jobId: string | null;
  userId: number | null;
  queue: string | null;
  data: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}): string {
  const lines: string[] = [];
  const levelLabel = payload.level.toUpperCase();
  const levelColor: Record<LogLevel, keyof typeof ANSI> = {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red',
  };
  const coloredLevel = colorize(levelLabel, levelColor[payload.level]);
  const coloredComponent = colorize(payload.component, 'cyan');
  const dimmedTimestamp = colorize(payload.timestamp, 'dim');

  lines.push(
    `${dimmedTimestamp} ${coloredLevel} ${coloredComponent} - ${payload.message}`,
  );

  if (payload.requestId) {
    lines.push(`requestId: ${payload.requestId}`);
  }
  if (payload.jobId) {
    lines.push(`jobId: ${payload.jobId}`);
  }
  if (payload.userId !== null) {
    lines.push(`userId: ${payload.userId}`);
  }
  if (payload.queue) {
    lines.push(`queue: ${payload.queue}`);
  }
  if (payload.data) {
    lines.push(`data: ${JSON.stringify(payload.data, null, 2)}`);
  }
  if (payload.error) {
    lines.push(`error: ${JSON.stringify(payload.error, null, 2)}`);
  }

  return lines.join('\n');
}

export class StructuredLogger {
  constructor(private readonly component: string) {}

  debug(context: Omit<LogContext, 'component'>): void {
    this.write('debug', context);
  }

  info(context: Omit<LogContext, 'component'>): void {
    this.write('info', context);
  }

  warn(context: Omit<LogContext, 'component'>): void {
    this.write('warn', context);
  }

  error(context: Omit<LogContext, 'component'>): void {
    this.write('error', context);
  }

  private write(level: LogLevel, context: Omit<LogContext, 'component'>): void {
    const activeLevel = resolveLogLevel();
    if (LEVEL_VALUES[level] < LEVEL_VALUES[activeLevel]) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message: context.message,
      requestId: context.requestId ?? null,
      jobId: context.jobId ?? null,
      userId: context.userId ?? null,
      queue: context.queue ?? null,
      data: context.data ?? null,
      error: serializeError(context.error),
    };

    const serialized =
      resolveLogFormat() === 'pretty'
        ? formatPretty(payload)
        : JSON.stringify(payload);
    if (level === 'error') {
      console.error(serialized);
      return;
    }

    if (level === 'warn') {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  }
}
