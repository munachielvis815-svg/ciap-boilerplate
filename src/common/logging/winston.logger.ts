import { LoggerService } from '@nestjs/common';
import { createLogger, format, transports, type Logger } from 'winston';

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
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, context, stack }) => {
      const contextStr = context ? JSON.stringify(context) : '';
      const stackStr = stack ? JSON.stringify(stack) : '';
      const contextPart = contextStr ? ` [${contextStr}]` : '';
      const stackPart = stackStr ? `\n${stackStr}` : '';
      const msgStr = String(message);
      const timestampStr =
        typeof timestamp === 'string'
          ? timestamp
          : timestamp instanceof Date
            ? timestamp.toISOString()
            : '';
      const levelStr = String(level ?? '').toUpperCase();
      return `${timestampStr} ${levelStr}${contextPart}: ${msgStr}${stackPart}`;
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
    this.logger.info(String(message), { context: context || this.context });
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.logger.error(String(message), {
      context: context || this.context,
      ...(trace ? { stack: trace } : {}),
    });
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn(String(message), { context: context || this.context });
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug(String(message), { context: context || this.context });
  }

  verbose(message: unknown, context?: string): void {
    this.logger.verbose(String(message), { context: context || this.context });
  }

  fatal(message: unknown, context?: string): void {
    this.logger.error(String(message), {
      context: context || this.context,
      fatal: true,
    });
  }
}
