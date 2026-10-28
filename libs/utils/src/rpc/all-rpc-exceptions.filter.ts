import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/** The only error shape microservices send back to the gateway. */
export interface RpcErrorPayload {
  statusCode: number;
  message: string | string[];
}

// PostgreSQL error codes that are caused by the request rather than a bug.
const POSTGRES_ERRORS: Record<string, RpcErrorPayload> = {
  '22P02': { statusCode: 400, message: 'Invalid identifier format' },
  '22001': { statusCode: 400, message: 'A value exceeds its maximum length' },
  '23503': {
    statusCode: 409,
    message: 'The operation conflicts with related records',
  },
  '23505': { statusCode: 409, message: 'The resource already exists' },
};

const INTERNAL_ERROR: RpcErrorPayload = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Internal server error',
};

const isErrorPayload = (value: unknown): value is RpcErrorPayload =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RpcErrorPayload).statusCode === 'number';

/**
 * Converts any exception thrown by a message handler into RpcErrorPayload.
 * Unexpected errors are logged with their stack and reported as a generic 500
 * so internal details (SQL, stack traces) never reach API clients.
 */
export function toRpcErrorPayload(
  exception: unknown,
  logger: Pick<Logger, 'error'> = new Logger('RpcExceptions')
): RpcErrorPayload {
  if (exception instanceof RpcException) {
    const error = exception.getError();
    if (isErrorPayload(error)) {
      return { statusCode: error.statusCode, message: error.message };
    }
    logger.error(`RpcException without status code: ${String(error)}`);
    return INTERNAL_ERROR;
  }

  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    const message =
      typeof response === 'string'
        ? response
        : (response as { message?: string | string[] }).message ??
          exception.message;
    return { statusCode: exception.getStatus(), message };
  }

  const code = (exception as { code?: unknown })?.code;
  if (typeof code === 'string' && POSTGRES_ERRORS[code]) {
    return POSTGRES_ERRORS[code];
  }

  logger.error(
    exception instanceof Error ? exception.message : String(exception),
    exception instanceof Error ? exception.stack : undefined
  );
  return INTERNAL_ERROR;
}

@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<unknown> {
  private readonly logger = new Logger('RpcExceptions');

  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    return throwError(() => toRpcErrorPayload(exception, this.logger));
  }
}
