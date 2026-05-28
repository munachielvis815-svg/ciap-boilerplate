import { LoggerService } from '@nestjs/common';
import { createLogger, format, transports, type Logger } from 'winston';
import { getUserId } from '@common/logging/request-context';

type WinstonLoggerOptions = {
  level: string;
  formatMode: 'pretty' | 'json';
  toFile: boolean;
  filePath: string;
  fileLevel: string;
};

function resolveWinstonFormat(mode: 'pretty' | 'json') {
  if (mode === 'json') {
    return format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    );
  }

  return format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, context, stack, userId }) => {
      const contextStr = context ? JSON.stringify(context) : '';
      const stackStr = stack ? JSON.stringify(stack) : '';
      const contextPart = contextStr ? ` [${contextStr}]` : '';
      const safeString = (v: unknown) => {
        if (v === null) return 'null';
        const t = typeof v;
        if (t === 'string') return v as string;
        if (
          t === 'number' ||
          t === 'boolean' ||
          t === 'bigint' ||
          t === 'symbol'
        )
          return String(v as number | boolean | bigint | symbol);
        if (t === 'undefined') return 'undefined';
        try {
          return JSON.stringify(v);
        } catch {
          return Object.prototype.toString.call(v);
        }
      };
      const userPart =
        typeof userId !== 'undefined' ? ` userId=${safeString(userId)}` : '';
      const stackPart = stackStr ? `\n${stackStr}` : '';
      const msgStr = String(message);
      const timestampStr =
        typeof timestamp === 'string'
          ? timestamp
          : timestamp instanceof Date
            ? timestamp.toISOString()
            : '';
      const levelStr = String(level ?? '');
      return `${timestampStr} ${levelStr}${contextPart}${userPart}: ${msgStr}${stackPart}`;
    }),
  );
}

export class WinstonLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor(
    private readonly context = 'Application',
    options: WinstonLoggerOptions,
  ) {
    const loggerTransports: Array<
      transports.ConsoleTransportInstance | transports.FileTransportInstance
    > = [new transports.Console({ level: options.level })];

    if (options.toFile) {
      loggerTransports.push(
        new transports.File({
          filename: options.filePath,
          level: options.fileLevel,
          maxsize: 10 * 1024 * 1024,
          maxFiles: 10,
          tailable: true,
        }),
      );
    }

    this.logger = createLogger({
      level: options.level,
      format: resolveWinstonFormat(options.formatMode),
      transports: loggerTransports,
    });
  }

  log(message: unknown, context?: string): void {
    const userId = getUserId();
    this.logger.info(String(message), {
      context: context || this.context,
      ...(userId ? { userId: String(userId) } : {}),
    });
  }

  error(message: unknown, trace?: string, context?: string): void {
    const userId = getUserId();
    this.logger.error(String(message), {
      context: context || this.context,
      ...(trace ? { stack: trace } : {}),
      ...(userId ? { userId: String(userId) } : {}),
    });
  }

  warn(message: unknown, context?: string): void {
    const userId = getUserId();
    this.logger.warn(String(message), {
      context: context || this.context,
      ...(userId ? { userId: String(userId) } : {}),
    });
  }

  debug(message: unknown, context?: string): void {
    const userId = getUserId();
    this.logger.debug(String(message), {
      context: context || this.context,
      ...(userId ? { userId: String(userId) } : {}),
    });
  }

  verbose(message: unknown, context?: string): void {
    const userId = getUserId();
    this.logger.verbose(String(message), {
      context: context || this.context,
      ...(userId ? { userId: String(userId) } : {}),
    });
  }

  fatal(message: unknown, context?: string): void {
    const userId = getUserId();
    this.logger.error(String(message), {
      context: context || this.context,
      fatal: true,
      ...(userId ? { userId: String(userId) } : {}),
    });
  }
}
