import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TaskModifyGuard } from './task-modify.guard';
import { TaskService } from '../../tasks/services/task.service';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { TaskResponseDto, TaskStatus, TaskPriority } from '@shared/contracts';
import { UserRole } from '@shared/contracts';

describe('TaskModifyGuard', () => {
  let guard: TaskModifyGuard;
  let taskService: jest.Mocked<TaskService>;
  let accessService: jest.Mocked<RemoteAccessService>;

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const mockTask: TaskResponseDto = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    project_id: 'project-123',
    created_by: 'user-456',
    assigned_to: 'user-123',
    due_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockContext = (
    user?: JwtPayload,
    taskId?: string
  ): ExecutionContext => {
    const request = {
      user,
      params: { id: taskId },
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockTaskService = {
      findOne: jest.fn(),
    };

    const mockAccessService = {
      getMemberRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskModifyGuard,
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
          provide: RemoteAccessService,
          useValue: mockAccessService,
        },
      ],
    }).compile();

    guard = module.get<TaskModifyGuard>(TaskModifyGuard);
    taskService = module.get(TaskService);
    accessService = module.get(RemoteAccessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not present', async () => {
      const context = createMockContext(undefined, 'task-123');

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Unauthorized');
    });

    it('should throw ForbiddenException when task id is not present', async () => {
      const context = createMockContext(mockUser, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Unauthorized');
    });

    it('should throw ForbiddenException when task is not found', async () => {
      const context = createMockContext(mockUser, 'non-existent-task');
      taskService.findOne.mockResolvedValue(null as any);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Task not found'
      );
      expect(taskService.findOne).toHaveBeenCalledWith('non-existent-task');
    });

    it('should return true when user is assigned to the task', async () => {
      const context = createMockContext(mockUser, 'task-123');
      taskService.findOne.mockResolvedValue(mockTask);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(accessService.getMemberRole).not.toHaveBeenCalled();
    });

    it('should return true when user is project admin', async () => {
      const taskAssignedToOther: TaskResponseDto = {
        ...mockTask,
        assigned_to: 'other-user',
      };
      const context = createMockContext(mockUser, 'task-123');
      taskService.findOne.mockResolvedValue(taskAssignedToOther);
      accessService.getMemberRole.mockResolvedValue('admin');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        'project-123',
        mockUser.sub
      );
    });

    it('should throw ForbiddenException when project_id is missing', async () => {
      const taskWithoutProject: TaskResponseDto = {
        ...mockTask,
        project_id: undefined as any,
        assigned_to: 'other-user',
      };
      const context = createMockContext(mockUser, 'task-123');
      taskService.findOne.mockResolvedValue(taskWithoutProject);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Project scope not resolved'
      );
    });

    it('should throw ForbiddenException when user is not assigned and not admin', async () => {
      const taskAssignedToOther: TaskResponseDto = {
        ...mockTask,
        assigned_to: 'other-user',
      };
      const context = createMockContext(mockUser, 'task-123');
      taskService.findOne.mockResolvedValue(taskAssignedToOther);
      accessService.getMemberRole.mockResolvedValue('member');

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Insufficient permissions to modify task'
      );
      expect(accessService.getMemberRole).toHaveBeenCalledWith(
        'project-123',
        mockUser.sub
      );
    });

    it('should throw ForbiddenException when user is not a project member', async () => {
      const taskAssignedToOther: TaskResponseDto = {
        ...mockTask,
        assigned_to: 'other-user',
      };
      const context = createMockContext(mockUser, 'task-123');
      taskService.findOne.mockResolvedValue(taskAssignedToOther);
      accessService.getMemberRole.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Insufficient permissions to modify task'
      );
    });
  });
});
