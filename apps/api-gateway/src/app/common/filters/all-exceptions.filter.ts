import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TimeoutError } from 'rxjs';
import { RpcErrorPayload } from '@libs/utils';
import { AppLogger } from '../logging/logger.service';

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE',
]);

const isRpcError = (value: unknown): value is RpcErrorPayload =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RpcErrorPayload).statusCode === 'number';

interface ErrorResponse {
  status: number;
  message: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject('LoggerService') private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    const { status, message } = this.resolve(exception);

    // Unexpected failures are logged with their real cause; the client only
    // sees the generic message.
    const stack =
      status >= 500 && exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `${request.method} ${path} ${status} - ${this.describe(exception, message)}`,
      stack,
      'HTTP'
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path,
    });
  }

  private resolve(exception: unknown): ErrorResponse {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return {
        status: exception.getStatus(),
        message:
          typeof body === 'string'
            ? body
            : (body as { message?: string | string[] }).message ??
              exception.message,
      };
    }

    // Errors from microservices, normalized by AllRpcExceptionsFilter.
    if (isRpcError(exception)) {
      return { status: exception.statusCode, message: exception.message };
    }

    if (exception instanceof TimeoutError) {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Upstream service did not respond in time',
      };
    }

    const code = (exception as { code?: unknown })?.code;
    if (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private describe(exception: unknown, message: string | string[]): string {
    const internal =
      exception instanceof Error && !(exception instanceof HttpException)
        ? exception.message
        : undefined;
    return internal && internal !== message ? `${message} (${internal})` : String(message);
  }
}
