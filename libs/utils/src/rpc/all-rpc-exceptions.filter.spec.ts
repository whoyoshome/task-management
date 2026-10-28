import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { toRpcErrorPayload } from './all-rpc-exceptions.filter';

describe('toRpcErrorPayload', () => {
  const logger = { error: jest.fn() };

  afterEach(() => jest.clearAllMocks());

  it('passes through an RpcException that already has a status code', () => {
    const payload = toRpcErrorPayload(
      new RpcException({ statusCode: 401, message: 'Invalid refresh token' }),
      logger
    );

    expect(payload).toEqual({ statusCode: 401, message: 'Invalid refresh token' });
  });

  it('maps HttpExceptions to their status and message', () => {
    expect(toRpcErrorPayload(new NotFoundException('Task not found'), logger))
      .toEqual({ statusCode: 404, message: 'Task not found' });
    expect(toRpcErrorPayload(new ForbiddenException(), logger)).toEqual({
      statusCode: 403,
      message: 'Forbidden',
    });
  });

  it('keeps validation messages from ValidationPipe', () => {
    const exception = new BadRequestException(['name should not be empty']);

    expect(toRpcErrorPayload(exception, logger)).toEqual({
      statusCode: 400,
      message: ['name should not be empty'],
    });
  });

  it('maps client-caused PostgreSQL errors without leaking SQL', () => {
    const duplicate = Object.assign(
      new Error('duplicate key value violates unique constraint "UQ_x"'),
      { code: '23505' }
    );
    const badUuid = Object.assign(
      new Error('invalid input syntax for type uuid: "abc"'),
      { code: '22P02' }
    );

    expect(toRpcErrorPayload(duplicate, logger)).toEqual({
      statusCode: 409,
      message: 'The resource already exists',
    });
    expect(toRpcErrorPayload(badUuid, logger).statusCode).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('hides unexpected errors behind a generic 500 and logs them', () => {
    const payload = toRpcErrorPayload(
      new Error('connection to db lost at 10.0.0.5'),
      logger
    );

    expect(payload).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'connection to db lost at 10.0.0.5',
      expect.any(String)
    );
  });

  it('treats an RpcException without status code as internal', () => {
    expect(toRpcErrorPayload(new RpcException('boom'), logger)).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
