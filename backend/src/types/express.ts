/**
 * Extended Express Request type with authenticated user information.
 */

import { Request } from 'express';
import type { RequestUser } from './index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends RequestUser {}
  }
}

export type AuthenticatedRequest = Request & {
  user: RequestUser;
};
