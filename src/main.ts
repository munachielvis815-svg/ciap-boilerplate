import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoNestLogger, PinoLogger } from 'nestjs-pino';
import type { NextFunction, Request, Response } from 'express';
import type { LogLevel, NodeEnv } from '@/types';
import type { Server as HttpServer } from 'http';
import type { Socket } from 'net';
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
    if (!logEnabled || !httpLogEnabled || httpLogMode === 'off') {
      return next();
    }

    const startedAt = Date.now();
    res.on('finish', () => {
      const responseTime = Date.now() - startedAt;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const statusCode = res.statusCode;
      const ip = req.ip || req.socket.remoteAddress || '-';
      const userAgent = req.get('user-agent') || '-';
      const contentLength = res.getHeader('content-length') || '-';
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
    return next();
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

  // Graceful shutdown state
  let isShuttingDown = false;
  const gracefulTimeout = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT ?? 30000);

  // Deny new requests once shutdown begins
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isShuttingDown) {
      res.setHeader('Connection', 'close');
      return res.status(503).send('Server is restarting');
    }
    return next();
  });

  // Track active (in-flight) requests so we can wait for them on shutdown
  let inflightRequests = 0;
  app.use((req: Request, res: Response, next: NextFunction) => {
    // If shutdown already started, don't increment (deny middleware handled it)
    if (isShuttingDown) return next();

    inflightRequests++;
    const decrement = () => {
      inflightRequests = Math.max(0, inflightRequests - 1);
    };
    res.once('finish', decrement);
    res.once('close', decrement);
    return next();
  });

  await app.listen(port);

  const server = app.getHttpServer() as HttpServer;

  const connections = new Set<Socket>();
  server.on('connection', (socket: Socket) => {
    connections.add(socket);
    socket.on('close', () => connections.delete(socket));
  });

  const logStartup = () => {
    bootstrapLogger.log(`Server running on http://localhost:${port}`);
    bootstrapLogger.log(`Swagger docs available at http://localhost:${port}/api-docs`);
    bootstrapLogger.log(`Health check at http://localhost:${port}/health`);
    bootstrapLogger.log(`Environment: ${nodeEnv}`);
    bootstrapLogger.log(`Logger enabled: ${logEnabled}`);
    bootstrapLogger.log(`Logger backend: ${logBackend}`);
    bootstrapLogger.log(`Log level: ${logLevel}`);
    bootstrapLogger.log(`Log format: ${logFormat}`);
    bootstrapLogger.log(`Log to file: ${logToFile}`);
    bootstrapLogger.log(`HTTP access logs: ${httpLogEnabled}`);
    bootstrapLogger.log(`HTTP access mode: ${httpLogMode}`);
  };

  logStartup();

  async function gracefulShutdown(signal?: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    bootstrapLogger.log(`Received ${signal ?? 'shutdown'}, starting graceful shutdown`);

    // Stop accepting new connections
    try {
      server.close((err) => {
        if (err) {
          bootstrapLogger.error('Error closing http server', err as any);
        }
      });
    } catch (err) {
      bootstrapLogger.error('Error calling server.close()', err as any);
    }

    // Allow Nest to run its lifecycle hooks (onModuleDestroy, beforeApplicationShutdown, etc.)
    try {
      await app.close();
      bootstrapLogger.log('Nest application closed');
    } catch (err) {
      bootstrapLogger.error('Error while closing Nest application', err as any);
    }

    // Wait for in-flight requests to finish, or until timeout
    const deadline = Date.now() + gracefulTimeout;
    while (inflightRequests > 0 && Date.now() < deadline) {
      bootstrapLogger.log(`Waiting for ${inflightRequests} in-flight request(s) to finish`);
      // wait 100ms
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100));
    }

    if (inflightRequests > 0) {
      bootstrapLogger.log(`Timeout reached, forcing close of ${connections.size} open connections and ${inflightRequests} in-flight request(s)`);
    } else {
      bootstrapLogger.log('All in-flight requests completed');
    }

    if (connections.size > 0) {
      connections.forEach((socket) => {
        try {
          socket.destroy();
        } catch (e) {
          // ignore
        }
      });
    }

    // exit explicitly to ensure the process stops if something else is keeping it alive
    process.exit(0);
  }

  // Handle signals
  process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.once('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.once('SIGHUP', () => void gracefulShutdown('SIGHUP'));

  // Unhandled errors -> attempt graceful shutdown
  process.on('unhandledRejection', (reason) => {
    bootstrapLogger.error('Unhandled Rejection:', reason as any);
    void gracefulShutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    bootstrapLogger.error('Uncaught Exception:', err as any);
    void gracefulShutdown('uncaughtException');
  });
}

void bootstrap();
