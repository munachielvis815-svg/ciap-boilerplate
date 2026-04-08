import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

/**
 * Catch-all exception filter for unexpected errors.
 * Handles any exception that wasn't caught by HttpExceptionFilter.
 * Returns safe JSON response without exposing internal details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('AllExceptionsFilter');

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
          ? (exceptionResponse as Record<string, any>)
          : { message: exceptionResponse };

      const formattedResponse = {
        statusCode,
        message: errorResponse.message || HttpStatus[statusCode] || 'Unknown Error',
        error: errorResponse.error || HttpStatus[statusCode],
        timestamp: errorResponse.timestamp || timestamp,
        path,
        ...(errorResponse.details && { details: errorResponse.details }),
      };

      const details =
        errorResponse.details && typeof errorResponse.details === 'object'
          ? JSON.stringify(errorResponse.details)
          : undefined;

      if (statusCode >= 500) {
        this.logger.error(
          `${method} ${path} - ${statusCode}: ${formattedResponse.message}`,
          exception.stack,
        );
      } else {
        const detailsSuffix = details ? ` | details=${details}` : '';
        this.logger.warn(`${method} ${path} - ${statusCode}: ${formattedResponse.message}${detailsSuffix}`);
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
      errorMessage = (exception as Record<string, any>)?.message || errorMessage;
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
    this.logger.error(`${method} ${path} - 500: ${errorMessage}`, errorStack);

    // Send safe response
    response.status(statusCode).json(formattedResponse);
  }
}
