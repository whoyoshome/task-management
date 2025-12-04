import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRolesGuard } from './project-roles.guard';
import { PROJECT_ROLES_KEY } from './project-roles.decorator';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ProjectRole } from '@shared/contracts';
import { UserRole } from '@shared/contracts';

describe('ProjectRolesGuard', () => {
  let guard: ProjectRolesGuard;
  let reflector: Reflector;
  let accessService: jest.Mocked<RemoteAccessService>;

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const createMockContext = (
    user?: JwtPayload,
    params: any = {},
    body: any = {},
    query: any = {},
    path: string = '',
    method: string = 'GET',
    originalUrl: string = ''
  ): ExecutionContext => {
    const request = {
      user,
      params,
      body,
      query,
      route: { path },
      method,
      originalUrl: originalUrl || path,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockAccessService = {
      getMemberRole: jest.fn(),
      resolveProjectId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: RemoteAccessService,
          useValue: mockAccessService,
        },
      ],
    }).compile();

    guard = module.get<ProjectRolesGuard>(ProjectRolesGuard);
    reflector = module.get<Reflector>(Reflector);
    accessService = module.get(RemoteAccessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', async () => {
      const context = createMockContext(mockUser);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when empty roles array', async () => {
      const context = createMockContext(mockUser);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not present', async () => {
      const context = createMockContext(undefined, {
        project_id: '11111111-1111-1111-1111-111111111111',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Unauthorized');
    });

    it('should resolve project_id from params', async () => {
      const context = createMockContext(mockUser, {
        project_id: '11111111-1111-1111-1111-111111111111',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.ADMIN);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        mockUser.sub
      );
    });

    it('should resolve project_id from body', async () => {
      const context = createMockContext(
        mockUser,
        {},
        { project_id: '22222222-2222-2222-2222-222222222222' }
      );
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.MEMBER]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.MEMBER);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        '22222222-2222-2222-2222-222222222222',
        mockUser.sub
      );
    });

    it('should resolve project_id from query', async () => {
      const context = createMockContext(
        mockUser,
        {},
        {},
        { project_id: '33333333-3333-3333-3333-333333333333' }
      );
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.VIEWER]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.VIEWER);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        '33333333-3333-3333-3333-333333333333',
        mockUser.sub
      );
    });

    it('should resolve project_id from task path', async () => {
      const context = createMockContext(
        mockUser,
        { id: 'task-123' },
        {},
        {},
        '/tasks/task-123',
        'GET'
      );
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.resolveProjectId.mockResolvedValue('11111111-1111-1111-1111-111111111111');
      accessService.getMemberRole.mockResolvedValue(ProjectRole.ADMIN);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(accessService.resolveProjectId).toHaveBeenCalledWith(
        'task',
        'task-123'
      );
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        mockUser.sub
      );
    });

    it('should resolve project_id from project path directly', async () => {
      const context = createMockContext(
        mockUser,
        { id: '11111111-1111-1111-1111-111111111111' },
        {},
        {},
        '/projects/11111111-1111-1111-1111-111111111111',
        'GET'
      );
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.ADMIN);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        mockUser.sub
      );
    });

    it('should throw ForbiddenException when project scope cannot be resolved', async () => {
      const context = createMockContext(mockUser);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Project scope not resolved'
      );
    });

    it('should throw ForbiddenException when user is not a project member', async () => {
      const context = createMockContext(mockUser, {
        project_id: '11111111-1111-1111-1111-111111111111',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.getMemberRole.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Not a project member'
      );
    });

    it('should throw ForbiddenException when user role is insufficient', async () => {
      const context = createMockContext(mockUser, {
        project_id: '11111111-1111-1111-1111-111111111111',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.VIEWER);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Insufficient project role'
      );
    });

    it('should return true when user has sufficient role', async () => {
      const context = createMockContext(mockUser, {
        project_id: '11111111-1111-1111-1111-111111111111',
      });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.MEMBER, ProjectRole.ADMIN]);
      accessService.getMemberRole.mockResolvedValue(ProjectRole.ADMIN);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow DELETE on non-existent project to return 404', async () => {
      const context = createMockContext(
        mockUser,
        { id: '44444444-4444-4444-4444-444444444444' },
        {},
        {},
        '/projects/44444444-4444-4444-4444-444444444444',
        'DELETE'
      );
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([ProjectRole.ADMIN]);
      accessService.resolveProjectId.mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
