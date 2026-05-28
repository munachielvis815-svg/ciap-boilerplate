import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';

type Store = { userId?: number | null };

const als = new AsyncLocalStorage<Store>();

export function requestContextMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  als.run({}, () => next());
}

export function setUserId(userId: number | null | undefined) {
  const store = als.getStore();
  if (!store) return;
  store.userId = typeof userId === 'number' ? userId : null;
}

export function getUserId(): number | undefined | null {
  return als.getStore()?.userId;
}

export function runWithContext<T>(fn: () => T, initial: Store = {}) {
  return als.run(initial, fn);
}
