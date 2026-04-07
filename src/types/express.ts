/**
 * Extended Express Request type with user information
 * Used throughout the application for authenticated requests
 */

import { Request } from 'express';
import { RequestUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: RequestUser;
};
