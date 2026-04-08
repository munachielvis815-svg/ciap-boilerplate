import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, LogLevel } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

const VALID_LOG_LEVELS: ReadonlySet<LogLevel> = new Set([
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
  'fatal',
]);

function resolveLogLevels(value: string | undefined): LogLevel[] {
  if (!value) {
    return ['log', 'error', 'warn', 'debug'];
  }

  const levels = value
    .split(',')
    .map((level) => level.trim().toLowerCase())
    .filter((level): level is LogLevel => VALID_LOG_LEVELS.has(level as LogLevel));

  return levels.length > 0 ? levels : ['log', 'error', 'warn', 'debug'];
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const logLevels = resolveLogLevels(process.env.LOG_LEVEL);
  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
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
    logger.log(`Server running on http://localhost:${port}`);
    logger.log(`Swagger docs available at http://localhost:${port}/api-docs`);
    logger.log(`Health check at http://localhost:${port}/health`);
    logger.log(`Environment: ${nodeEnv}`);
    logger.log(`Log levels: ${logLevels.join(', ')}`);
  });
}

bootstrap();
