import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
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

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new BadRequestException('Invalid input');
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid input',
        timestamp: expect.any(String),
        path: '/api/test',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'GET /api/test 400 - Invalid input',
        undefined,
        'HTTP'
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        errors: ['field1 is required'],
      });
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle ForbiddenException', () => {
      const exception = new ForbiddenException('Access denied');
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access denied',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle microservice error with statusCode', () => {
      const exception = {
        statusCode: 404,
        message: 'Service error',
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Service error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle microservice error with nested error object', () => {
      const exception = {
        error: {
          statusCode: 400,
          message: 'Bad request from service',
        },
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Bad request from service',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle microservice error with nested response object', () => {
      const exception = {
        response: {
          statusCode: 500,
          message: 'Internal service error',
        },
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal service error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle connection errors (ECONNREFUSED)', () => {
      const exception = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle connection errors (ECONNRESET)', () => {
      const exception = {
        code: 'ECONNRESET',
        message: 'Connection reset',
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle error with JSON string message', () => {
      const exception = {
        message: JSON.stringify({
          statusCode: 400,
          message: 'Parsed error message',
        }),
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Parsed error message',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle error with non-JSON string message', () => {
      const exception = {
        message: 'Simple error message',
      };
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Simple error message',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle unknown error types', () => {
      const exception = new Error('Unknown error');
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle unknown error types', () => {
      const exception = new Error('Unknown error');
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should use default message when error has no message', () => {
      const exception = {};
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle null/undefined exceptions', () => {
      const exception = null;
      const host = createMockArgumentsHost();
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should use correct request path and method', () => {
      const exception = new BadRequestException('Test error');
      const host = createMockArgumentsHost({
        method: 'POST',
        url: '/api/users/123',
      });
      const response = host.switchToHttp().getResponse<Response>();

      filter.catch(exception, host);

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
});
