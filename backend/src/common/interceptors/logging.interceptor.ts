import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { WinstonLoggerService } from '@common/logging/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new WinstonLoggerService('LoggingInterceptor', {
    level: process.env.LOG_LEVEL || 'info',
    formatMode: process.env.LOG_FORMAT === 'pretty' ? 'pretty' : 'json',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/ciap.log',
    fileLevel: process.env.LOG_FILE_LEVEL || process.env.LOG_LEVEL || 'info',
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method || 'UNKNOWN';
    const url =
      (req as Request & { originalUrl?: string }).originalUrl ||
      req.url ||
      'UNKNOWN';
    const start = Date.now();

    this.logger.debug(`ENTER ${method} ${url}`, 'HTTP');

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - start;
          this.logger.debug(`EXIT ${method} ${url} time=${elapsed}ms`, 'HTTP');
        },
        error: (err) => {
          const elapsed = Date.now() - start;
          this.logger.error(
            `ERROR ${method} ${url} time=${elapsed}ms`,
            err instanceof Error ? err.stack : String(err),
            'HTTP',
          );
        },
      }),
    );
  }
}
