import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

/**
 * HTTP Exception Filter
 *
 * Catches all HTTP exceptions and wraps them in the standardized ApiResponseDto
 * error envelope to ensure consistent error responses.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string }).message || exception.message;

    const errorResponse = new ApiResponseDto(
      null,
      false,
      message || 'An error occurred',
    );

    response.status(status).json(errorResponse);
  }
}

/**
 * Catch-All Exception Filter
 *
 * Catches any unhandled exceptions and wraps them in the standardized envelope
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Internal server error';
    if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = new ApiResponseDto(null, false, message);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}
