import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { setUserId } from '@common/logging/request-context';
import type { RequestUser } from '@/types';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser; __userId?: number }>();
    if (
      req &&
      req.user &&
      (typeof req.user.id === 'number' || typeof req.user.id === 'string')
    ) {
      const rawId = req.user.id as number | string;
      const parsed = typeof rawId === 'number' ? rawId : Number(rawId);
      if (!Number.isNaN(parsed)) {
        setUserId(parsed);
        // Persist userId on the request object so access-logging (outside ALS)
        // can reliably include it in logs.
        try {
          req.__userId = parsed;
        } catch {
          // ignore if request is frozen
        }
      }
    }
    return next.handle();
  }
}
