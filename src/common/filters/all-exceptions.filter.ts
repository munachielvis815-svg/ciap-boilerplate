import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '@common/logging/logger';

/**
 * Catch-all exception filter for unexpected errors.
 * Handles any exception that wasn't caught by HttpExceptionFilter.
 * Returns safe JSON response without exposing internal details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new WinstonLoggerService('AllExceptionsFilter', {
    level: process.env.LOG_LEVEL || 'error',
    formatMode: process.env.LOG_FORMAT === 'pretty' ? 'pretty' : 'json',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/ciap.log',
    fileLevel: process.env.LOG_FILE_LEVEL || process.env.LOG_LEVEL || 'error',
  });

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Preserve HttpException status/response (e.g. Unauthorized = 401)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorResponse =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as Record<string, unknown>)
          : { message: exceptionResponse };
      const detailsField =
        typeof errorResponse.details !== 'undefined'
          ? { details: errorResponse.details }
          : {};

      const formattedResponse = {
        statusCode,
        message: String(
          typeof errorResponse.message === 'string'
            ? errorResponse.message
            : HttpStatus[statusCode] || 'Unknown Error',
        ),
        error: errorResponse.error || HttpStatus[statusCode],
        timestamp: errorResponse.timestamp || timestamp,
        path,
        ...detailsField,
      };

      const details =
        errorResponse.details && typeof errorResponse.details === 'object'
          ? JSON.stringify(errorResponse.details)
          : undefined;

      const logMessage = `${method} ${path} - ${statusCode}: ${String(formattedResponse.message)}`;
      if (statusCode >= 500) {
        const stack = exception instanceof Error ? exception.stack : undefined;
        this.logger.error(
          logMessage,
          stack ?? undefined,
          'AllExceptionsFilter',
        );
      } else {
        const detailsSuffix = details ? ` | details=${details}` : '';
        this.logger.warn(
          `${logMessage}${detailsSuffix}`,
          'AllExceptionsFilter',
        );
      }

      response.status(statusCode).json(formattedResponse);
      return;
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    // Get error message and stack
    let errorMessage = 'An unexpected error occurred';
    let errorStack = '';

    if (exception instanceof Error) {
      errorMessage = exception.message;
      errorStack = exception.stack || '';
    } else if (typeof exception === 'string') {
      errorMessage = exception;
    } else if (typeof exception === 'object') {
      const message = (exception as Record<string, unknown>)?.message;
      if (typeof message === 'string' && message.trim()) {
        errorMessage = message;
      }
    }

    // Safe response to client (no internal details)
    const formattedResponse = {
      statusCode,
      message: 'An error occurred processing your request',
      error: 'Internal Server Error',
      timestamp,
      path,
    };

    // Log full error details internally
    const logMessage = `${method} ${path} - 500: ${errorMessage}`;
    this.logger.error(
      logMessage,
      errorStack || undefined,
      'AllExceptionsFilter',
    );

    // Send safe response
    response.status(statusCode).json(formattedResponse);
  }
}
