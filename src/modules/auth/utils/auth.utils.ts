import type { Request } from 'express';

export const getRequestIp = (request: Request): string | null => {
  if (request.ip) {
    return request.ip;
  }

  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  return null;
};
