import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@shared/contracts';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user?: JwtPayload, roles?: string[]) => {
    const request = {
      user,
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const { context } = mockExecutionContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return true when user has required role', () => {
      const user: JwtPayload = {
        sub: 'user-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };
      const { context } = mockExecutionContext(user, [UserRole.ADMIN]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      const user: JwtPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: UserRole.USER,
      };
      const { context } = mockExecutionContext(user);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Insufficient role');
    });

    it('should throw ForbiddenException when user is not present', () => {
      const { context } = mockExecutionContext(undefined);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Insufficient role');
    });

    it('should return true when user role is in required roles array', () => {
      const user: JwtPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: UserRole.USER,
      };
      const { context } = mockExecutionContext(user);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER, UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
