import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logging/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject('LoggerService') private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as any).message;
      }
    } else {
      const anyErr = exception as any;

      if (anyErr && typeof anyErr === 'object') {
        if (typeof anyErr.statusCode === 'number') {
          status = anyErr.statusCode;
          message = anyErr.message ?? message;
        }
        else if (
          anyErr.error &&
          typeof anyErr.error === 'object' &&
          typeof anyErr.error.statusCode === 'number'
        ) {
          status = anyErr.error.statusCode;
          message = anyErr.error.message ?? message;
        }
        else if (
          anyErr.response &&
          typeof anyErr.response === 'object' &&
          typeof anyErr.response.statusCode === 'number'
        ) {
          status = anyErr.response.statusCode;
          message = anyErr.response.message ?? message;
        }
        else if (anyErr.code === 'ECONNREFUSED' || anyErr.code === 'ECONNRESET') {
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Service temporarily unavailable';
        }
        else if (typeof anyErr.message === 'string') {
          try {
            const parsed = JSON.parse(anyErr.message);
            if (typeof parsed?.statusCode === 'number') {
              status = parsed.statusCode;
              message = parsed.message ?? message;
            } else {
              message = anyErr.message || message;
            }
          } catch {
            message = anyErr.message || message;
          }
        }
      }
    }

    this.logger.error(
      `${request.method} ${path} ${status} - ${message}`,
      undefined,
      'HTTP'
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp,
      path,
    });
  }
}
