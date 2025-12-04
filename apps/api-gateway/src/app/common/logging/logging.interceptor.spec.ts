import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { AppLogger } from './logger.service';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: jest.Mocked<AppLogger>;

  const createMockExecutionContext = (
    method: string = 'GET',
    url: string = '/api/test'
  ): ExecutionContext => {
    const request = {
      method,
      url,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: any = { data: 'test' }) => {
    return {
      handle: jest.fn().mockReturnValue(of(returnValue)),
    } as CallHandler;
  };

  beforeEach(async () => {
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    logger = module.get('LoggerService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log request with method and url', (done) => {
      const context = createMockExecutionContext('GET', '/api/users');
      const handler = createMockCallHandler();

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(/^GET \/api\/users - \d+ms$/),
            'HTTP'
          );
          done();
        },
        error: done,
      });
    });

    it('should log POST request', (done) => {
      const context = createMockExecutionContext('POST', '/api/tasks');
      const handler = createMockCallHandler({ id: '123' });

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(/^POST \/api\/tasks - \d+ms$/),
            'HTTP'
          );
          done();
        },
        error: done,
      });
    });

    it('should log PUT request', (done) => {
      const context = createMockExecutionContext('PUT', '/api/users/123');
      const handler = createMockCallHandler();

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(/^PUT \/api\/users\/123 - \d+ms$/),
            'HTTP'
          );
          done();
        },
        error: done,
      });
    });

    it('should log DELETE request', (done) => {
      const context = createMockExecutionContext('DELETE', '/api/tasks/456');
      const handler = createMockCallHandler();

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(/^DELETE \/api\/tasks\/456 - \d+ms$/),
            'HTTP'
          );
          done();
        },
        error: done,
      });
    });

    it('should log PATCH request', (done) => {
      const context = createMockExecutionContext('PATCH', '/api/projects/789');
      const handler = createMockCallHandler();

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(/^PATCH \/api\/projects\/789 - \d+ms$/),
            'HTTP'
          );
          done();
        },
        error: done,
      });
    });

    it('should call handler.handle', (done) => {
      const context = createMockExecutionContext();
      const handler = createMockCallHandler();
      const handleSpy = jest.spyOn(handler, 'handle');

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(handleSpy).toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('should return observable from handler', (done) => {
      const context = createMockExecutionContext();
      const handler = createMockCallHandler({ success: true });

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({ success: true });
          done();
        },
        error: done,
      });
    });

    it('should measure execution time', (done) => {
      const context = createMockExecutionContext();
      const handler = createMockCallHandler();

      const startTime = Date.now();
      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          const endTime = Date.now();
          const loggedMessage = (logger.log as jest.Mock).mock.calls[0][0];
          const timeMatch = loggedMessage.match(/(\d+)ms$/);
          const loggedTime = parseInt(timeMatch?.[1] || '0', 10);

          expect(loggedTime).toBeGreaterThanOrEqual(0);
          expect(loggedTime).toBeLessThan(endTime - startTime + 100);
          done();
        },
        error: done,
      });
    });

    it('should log with HTTP context', (done) => {
      const context = createMockExecutionContext('GET', '/api/test');
      const handler = createMockCallHandler();

      const result = interceptor.intercept(context, handler);

      result.subscribe({
        next: () => {
          expect(logger.log).toHaveBeenCalledWith(expect.any(String), 'HTTP');
          done();
        },
        error: done,
      });
    });
  });
});
