import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, type Params } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from '@modules/health/health.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { DatabaseModule } from '@database/database.module';
import { CommonModule } from '@common/common.module';

type LogFormat = 'pretty' | 'json';
type LoggerBackend = 'pino' | 'nest' | 'winston';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSY_VALUES = new Set(['0', 'false', 'no', 'off']);

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUTHY_VALUES.has(normalized)) {
    return true;
  }
  if (FALSY_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
}

function resolveLogFormat(value: string | undefined): LogFormat {
  if (!value) {
    return 'json';
  }

  const normalized = value.trim().toLowerCase();
  return normalized === 'pretty' ? 'pretty' : 'json';
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

function buildLoggerParams(): Params {
  const enabled = parseBoolean(process.env.LOG_ENABLED, true);
  const backend = resolveLoggerBackend(process.env.LOG_BACKEND);
  const level = process.env.LOG_LEVEL?.trim() || 'info';
  const format = resolveLogFormat(process.env.LOG_FORMAT);
  const toFile = parseBoolean(process.env.LOG_TO_FILE, false);
  const file = process.env.LOG_FILE_PATH?.trim() || './logs/ciap.log';
  const fileLevel = process.env.LOG_FILE_LEVEL?.trim() || level;
  const fileSize = process.env.LOG_FILE_SIZE?.trim() || '50m';
  const fileFrequency = process.env.LOG_FILE_FREQUENCY?.trim() || 'daily';

  const targets: Array<Record<string, unknown>> = [];

  if (format === 'pretty') {
    targets.push({
      target: 'pino-pretty',
      level,
      options: {
        colorize: true,
        singleLine: false,
        translateTime: 'SYS:standard',
      },
    });
  } else {
    // Keep structured JSON logs on stdout when pretty mode is off.
    targets.push({
      target: 'pino/file',
      level,
      options: {
        destination: 1,
      },
    });
  }

  if (toFile) {
    targets.push({
      target: 'pino-roll',
      level: fileLevel,
      options: {
        file,
        size: fileSize,
        frequency: fileFrequency,
        mkdir: true,
      },
    });
  }

  const pinoHttp = {
      enabled: enabled && backend === 'pino',
      level,
      // Access logs are emitted manually in main.ts to keep concise winston-style lines.
      autoLogging: false,
      quietReqLogger: true,
      quietResLogger: true,
      transport: { targets } as unknown,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
    } as Params['pinoHttp'];

  return {
    pinoHttp,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    // Logger module stays registered so backend can be switched via env.
    LoggerModule.forRoot(buildLoggerParams()),
    CommonModule,
    DatabaseModule,
    SessionsModule,
    RbacModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
