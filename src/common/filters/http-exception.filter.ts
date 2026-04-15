import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

/**
 * Filter for handling HttpException and subclasses.
 * Catches exceptions with known HTTP status codes and formats response.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpExceptionFilter');

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

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode}: ${String(formattedResponse.message)}`,
        exception.stack,
      );
    } else {
      const detailsSuffix = details ? ` | details=${details}` : '';
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode}: ${String(formattedResponse.message)}${detailsSuffix}`,
      );
    }

    // Send response (no stack trace to client)
    response.status(statusCode).json(formattedResponse);
  }
}
