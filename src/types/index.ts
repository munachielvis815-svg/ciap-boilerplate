/**
 * Central type definitions for the application
 * All shared types should be defined here and exported
 */

export type NodeEnv = 'development' | 'staging' | 'production';

export type LogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose';

/**
 * API Response wrapper type for consistent responses
 */
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error response type
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

/**
 * JWT Payload type for authentication
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Request user type (attached to Express Request)
 */
export interface RequestUser {
  id: string;
  email: string;
  role: string;
}
