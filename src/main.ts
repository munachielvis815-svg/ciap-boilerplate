import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoNestLogger, PinoLogger } from 'nestjs-pino';
import type { NextFunction, Request, Response } from 'express';
import type { LogLevel, NodeEnv } from '@/types';
import { WinstonLoggerService } from '@common/logging/winston.logger';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

type LoggerBackend = 'pino' | 'nest' | 'winston';
type HttpLogMode = 'off' | 'errors' | 'all';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return TRUTHY_VALUES.has(value.trim().toLowerCase());
}

function resolveLoggerBackend(value: string | undefined): LoggerBackend {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'nest') {
    return 'nest';
  }
  if (normalized === 'winston') {
    return 'winston';
  }
  return 'pino';
}

function resolveLogFormat(value: string | undefined): 'pretty' | 'json' {
  return value?.trim().toLowerCase() === 'pretty' ? 'pretty' : 'json';
}

function resolveHttpLogMode(value: string | undefined): HttpLogMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'off') {
    return 'off';
  }
  if (normalized === 'all') {
    return 'all';
  }
  return 'errors';
}

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');
  const port = Number(process.env.PORT || 3000);
  const nodeEnv =
    (process.env.NODE_ENV as NodeEnv | undefined) || 'development';
  const logFormat = resolveLogFormat(process.env.LOG_FORMAT);
  const logEnabled = parseBoolean(process.env.LOG_ENABLED, true);
  const logToFile = parseBoolean(process.env.LOG_TO_FILE, false);
  const logLevel = (process.env.LOG_LEVEL as LogLevel | undefined) || 'info';
  const logBackend = resolveLoggerBackend(process.env.LOG_BACKEND);
  const httpLogEnabled = parseBoolean(process.env.LOG_HTTP_ENABLED, true);
  const httpLogMode = resolveHttpLogMode(process.env.LOG_HTTP_MODE);
  const winstonLogger = new WinstonLoggerService('WinstonBootstrap', {
    level: logLevel,
    formatMode: logFormat,
    toFile: logToFile,
    filePath: process.env.LOG_FILE_PATH || './logs/ciap.log',
    fileLevel: process.env.LOG_FILE_LEVEL || logLevel,
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    ...(logBackend === 'winston' ? { logger: winstonLogger } : {}),
  });
  if (logBackend === 'pino') {
    app.useLogger(app.get(PinoNestLogger));
  }
  if (logBackend === 'winston') {
    app.useLogger(winstonLogger);
  }

  const pinoAccessLogger = logBackend === 'pino' ? PinoLogger.root : null;
  const nestAccessLogger = logBackend === 'nest' ? new Logger('HTTP') : null;
  const winstonAccessLogger =
    logBackend === 'winston'
      ? new WinstonLoggerService('HTTP', {
          level: logLevel,
          formatMode: logFormat,
          toFile: logToFile,
          filePath: process.env.LOG_FILE_PATH || './logs/ciap.log',
          fileLevel: process.env.LOG_FILE_LEVEL || logLevel,
        })
      : null;

  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      if (!logEnabled || !httpLogEnabled) {
        return;
      }

      const responseTime = Date.now() - startedAt;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const statusCode = res.statusCode;
      const ip = req.ip || req.socket.remoteAddress || '-';
      const userAgent = req.get('user-agent') || '-';
      const contentLength = res.getHeader('content-length') || '-';
      if (httpLogMode === 'off') {
        return;
      }
      if (httpLogMode === 'errors' && statusCode < 400) {
        return;
      }

      const message = `${method} ${url} status=${statusCode} duration=${responseTime}ms ip=${ip} bytes=${String(contentLength)} ua="${String(userAgent)}"`;

      if (statusCode >= 500) {
        if (pinoAccessLogger) {
          pinoAccessLogger.error({ context: 'HTTP' }, message);
        } else if (nestAccessLogger) {
          nestAccessLogger.error(message);
        } else if (winstonAccessLogger) {
          winstonAccessLogger.error(message);
        }
      } else if (statusCode >= 400) {
        if (pinoAccessLogger) {
          pinoAccessLogger.warn({ context: 'HTTP' }, message);
        } else if (nestAccessLogger) {
          nestAccessLogger.warn(message);
        } else if (winstonAccessLogger) {
          winstonAccessLogger.warn(message);
        }
      } else {
        if (pinoAccessLogger) {
          pinoAccessLogger.info({ context: 'HTTP' }, message);
        } else if (nestAccessLogger) {
          nestAccessLogger.log(message);
        } else if (winstonAccessLogger) {
          winstonAccessLogger.log(message);
        }
      }
    });
    next();
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger/OpenAPI Documentation
  setupSwagger(app);

  await app.listen(port, () => {
    bootstrapLogger.log(`Server running on http://localhost:${port}`);
    bootstrapLogger.log(
      `Swagger docs available at http://localhost:${port}/api-docs`,
    );
    bootstrapLogger.log(`Health check at http://localhost:${port}/health`);
    bootstrapLogger.log(`Environment: ${nodeEnv}`);
    bootstrapLogger.log(`Logger enabled: ${logEnabled}`);
    bootstrapLogger.log(`Logger backend: ${logBackend}`);
    bootstrapLogger.log(`Log level: ${logLevel}`);
    bootstrapLogger.log(`Log format: ${logFormat}`);
    bootstrapLogger.log(`Log to file: ${logToFile}`);
    bootstrapLogger.log(`HTTP access logs: ${httpLogEnabled}`);
    bootstrapLogger.log(`HTTP access mode: ${httpLogMode}`);
  });
}

void bootstrap();
