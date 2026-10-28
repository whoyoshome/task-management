import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TimeoutError } from 'rxjs';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppLogger } from '../logging/logger.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logger: jest.Mocked<AppLogger>;

  const createMockArgumentsHost = (
    request: Partial<Request> = {},
    response: Partial<Response> = {}
  ): ArgumentsHost => {
    const mockRequest = {
      method: 'GET',
      url: '/api/test',
      ...request,
    } as Request;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      ...response,
    } as unknown as Response;

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ArgumentsHost;
  };

  const run = (exception: unknown, request: Partial<Request> = {}) => {
    const host = createMockArgumentsHost(request);
    filter.catch(exception, host);
    return host.switchToHttp().getResponse<Response>();
  };

  const expectBody = (
    response: Response,
    statusCode: number,
    message: string | string[]
  ) => {
    expect(response.status).toHaveBeenCalledWith(statusCode);
    expect(response.json).toHaveBeenCalledWith({
      statusCode,
      message,
      timestamp: expect.any(String),
      path: '/api/test',
    });
  };

  beforeEach(async () => {
    const mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    logger = module.get('LoggerService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP exceptions', () => {
    it('should handle HttpException with string message', () => {
      const response = run(new BadRequestException('Invalid input'));

      expectBody(response, HttpStatus.BAD_REQUEST, 'Invalid input');
      expect(logger.error).toHaveBeenCalledWith(
        'GET /api/test 400 - Invalid input',
        undefined,
        'HTTP'
      );
    });

    it('should handle HttpException with object response', () => {
      const response = run(
        new BadRequestException({
          message: 'Validation failed',
          errors: ['field1 is required'],
        })
      );

      expectBody(response, HttpStatus.BAD_REQUEST, 'Validation failed');
    });

    it('should keep validation message arrays', () => {
      const response = run(
        new BadRequestException(['name should not be empty'])
      );

      expectBody(response, HttpStatus.BAD_REQUEST, ['name should not be empty']);
    });

    it('should handle NotFoundException and ForbiddenException', () => {
      expectBody(
        run(new NotFoundException('Resource not found')),
        HttpStatus.NOT_FOUND,
        'Resource not found'
      );
      expectBody(
        run(new ForbiddenException('Access denied')),
        HttpStatus.FORBIDDEN,
        'Access denied'
      );
    });
  });

  describe('microservice errors', () => {
    it('should use the status and message of an RPC error payload', () => {
      const response = run({ statusCode: 404, message: 'Task not found' });

      expectBody(response, 404, 'Task not found');
    });

    it('should map RPC timeouts to 504', () => {
      const response = run(new TimeoutError());

      expectBody(
        response,
        HttpStatus.GATEWAY_TIMEOUT,
        'Upstream service did not respond in time'
      );
    });

    it.each(['ECONNREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'ENOTFOUND'])(
      'should map connection error %s to 503',
      (code) => {
        const response = run({ code, message: `connect ${code}` });

        expectBody(
          response,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Service temporarily unavailable'
        );
      }
    );
  });

  describe('unexpected errors', () => {
    it('should not leak internal messages to the client', () => {
      const error = new Error('relation "tasks" does not exist');
      const response = run(error);

      expectBody(
        response,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error'
      );
      expect(logger.error).toHaveBeenCalledWith(
        'GET /api/test 500 - Internal server error (relation "tasks" does not exist)',
        error.stack,
        'HTTP'
      );
    });

    it('should treat plain objects without status code as internal', () => {
      expectBody(
        run({ message: 'Simple error message' }),
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error'
      );
    });

    it('should handle empty and null exceptions', () => {
      expectBody(run({}), HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
      expectBody(run(null), HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    });
  });

  it('should use correct request path and method', () => {
    const response = run(new BadRequestException('Test error'), {
      method: 'POST',
      url: '/api/users/123',
    });

    expect(logger.error).toHaveBeenCalledWith(
      'POST /api/users/123 400 - Test error',
      undefined,
      'HTTP'
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/users/123',
      })
    );
  });
});
