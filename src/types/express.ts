/**
 * Extended Express Request type with authenticated user information.
 */

import { Request } from 'express';
import type { RequestUser } from './index';

declare global {
  namespace Express {
    interface User extends RequestUser {}
  }
}

export type AuthenticatedRequest = Request & {
  user: RequestUser;
};
