import { Test, TestingModule } from '@nestjs/testing';
import * as winston from 'winston';
import { AppLogger } from './logger.service';

jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

describe('AppLogger', () => {
  let logger: AppLogger;
  let winstonLogger: jest.Mocked<winston.Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLogger],
    }).compile();

    logger = module.get<AppLogger>(AppLogger);
    winstonLogger = (logger as any).logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should call winston info with message', () => {
      logger.log('Test message');

      expect(winstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: undefined,
      });
    });

    it('should call winston info with message and context', () => {
      logger.log('Test message', 'HTTP');

      expect(winstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'HTTP',
      });
    });

    it('should handle empty message', () => {
      logger.log('', 'Context');

      expect(winstonLogger.info).toHaveBeenCalledWith('', {
        context: 'Context',
      });
    });
  });

  describe('error', () => {
    it('should call winston error with message', () => {
      logger.error('Error message');

      expect(winstonLogger.error).toHaveBeenCalledWith('Error message', {
        trace: undefined,
        context: undefined,
      });
    });

    it('should call winston error with message and trace', () => {
      logger.error('Error message', 'Stack trace');

      expect(winstonLogger.error).toHaveBeenCalledWith('Error message', {
        trace: 'Stack trace',
        context: undefined,
      });
    });

    it('should call winston error with message, trace and context', () => {
      logger.error('Error message', 'Stack trace', 'HTTP');

      expect(winstonLogger.error).toHaveBeenCalledWith('Error message', {
        trace: 'Stack trace',
        context: 'HTTP',
      });
    });

    it('should call winston error with message and context only', () => {
      logger.error('Error message', undefined, 'HTTP');

      expect(winstonLogger.error).toHaveBeenCalledWith('Error message', {
        trace: undefined,
        context: 'HTTP',
      });
    });
  });

  describe('warn', () => {
    it('should call winston warn with message', () => {
      logger.warn('Warning message');

      expect(winstonLogger.warn).toHaveBeenCalledWith('Warning message', {
        context: undefined,
      });
    });

    it('should call winston warn with message and context', () => {
      logger.warn('Warning message', 'Application');

      expect(winstonLogger.warn).toHaveBeenCalledWith('Warning message', {
        context: 'Application',
      });
    });
  });

  describe('debug', () => {
    it('should call winston debug with message when method exists', () => {
      if (logger.debug) {
        logger.debug('Debug message');

        expect(winstonLogger.debug).toHaveBeenCalledWith('Debug message', {
          context: undefined,
        });
      }
    });

    it('should call winston debug with message and context when method exists', () => {
      if (logger.debug) {
        logger.debug('Debug message', 'DebugContext');

        expect(winstonLogger.debug).toHaveBeenCalledWith('Debug message', {
          context: 'DebugContext',
        });
      }
    });
  });

  describe('verbose', () => {
    it('should call winston verbose with message when method exists', () => {
      if (logger.verbose) {
        logger.verbose('Verbose message');

        expect(winstonLogger.verbose).toHaveBeenCalledWith('Verbose message', {
          context: undefined,
        });
      }
    });

    it('should call winston verbose with message and context when method exists', () => {
      if (logger.verbose) {
        logger.verbose('Verbose message', 'VerboseContext');

        expect(winstonLogger.verbose).toHaveBeenCalledWith('Verbose message', {
          context: 'VerboseContext',
        });
      }
    });
  });

  describe('winston logger initialization', () => {
    it('should create winston logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      const createLoggerCall = (winston.createLogger as jest.Mock).mock
        .calls[0][0];

      expect(createLoggerCall).toMatchObject({
        level: 'info',
      });
      expect(createLoggerCall.transports).toBeDefined();
      expect(createLoggerCall.transports.length).toBeGreaterThan(0);
    });
  });

  describe('LoggerService interface', () => {
    it('should implement LoggerService interface', () => {
      expect(logger).toHaveProperty('log');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });
  });
});
