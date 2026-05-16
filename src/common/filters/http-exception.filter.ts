import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '@common/logging/logger';

/**
 * Filter for handling HttpException and subclasses.
 * Catches exceptions with known HTTP status codes and formats response.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new WinstonLoggerService('HttpExceptionFilter', {
    level: process.env.LOG_LEVEL || 'error',
    formatMode: process.env.LOG_FORMAT === 'pretty' ? 'pretty' : 'json',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/ciap.log',
    fileLevel: process.env.LOG_FILE_LEVEL || process.env.LOG_LEVEL || 'error',
  });

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Get error details (may include custom fields for known exceptions)
    const errorResponse =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as Record<string, unknown>)
        : { message: exceptionResponse };
    const detailsField =
      typeof errorResponse.details !== 'undefined'
        ? { details: errorResponse.details }
        : {};

    // Ensure response structure
    const formattedResponse = {
      statusCode,
      message: String(
        typeof errorResponse.message === 'string'
          ? errorResponse.message
          : HttpStatus[statusCode] || 'Unknown Error',
      ),
      error: errorResponse.error || HttpStatus[statusCode],
      timestamp: errorResponse.timestamp || new Date().toISOString(),
      path: request.url,
      ...detailsField,
    };

    const details =
      errorResponse.details && typeof errorResponse.details === 'object'
        ? JSON.stringify(errorResponse.details)
        : undefined;

    const logMessage = `${request.method} ${request.url} - ${statusCode}: ${String(
      formattedResponse.message,
    )}`;
    if (statusCode >= 500) {
      const stack =
        (exception as unknown) instanceof Error
          ? (exception as Error).stack
          : undefined;
      this.logger.error(logMessage, stack ?? undefined, 'HttpExceptionFilter');
    } else {
      const detailsSuffix = details ? ` | details=${details}` : '';
      this.logger.warn(`${logMessage}${detailsSuffix}`, 'HttpExceptionFilter');
    }

    // Send response (no stack trace to client)
    response.status(statusCode).json(formattedResponse);
  }
}
