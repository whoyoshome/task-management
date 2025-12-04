import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskFilterDto,
  TaskStatus,
  TaskPriority,
} from '@shared/contracts';
import { RemoteAccessService } from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskModifyGuard } from '../../common/guards/task-modify.guard';

describe('TaskController', () => {
  let controller: TaskController;
  let service: jest.Mocked<TaskService>;

  const mockTask: TaskResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    project_id: 'project-123',
    created_by: 'user-123',
    assigned_to: 'user-456',
    due_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOneWithDetails: jest.fn(),
    getHistory: jest.fn(),
    findFiltered: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockService,
        },
        {
          provide: RemoteAccessService,
          useValue: {
            resolveProjectId: jest.fn(),
            getMemberRole: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ProjectRolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(TaskModifyGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-123',
        created_by: 'user-123',
        assigned_to: 'user-456',
      };

      service.create.mockResolvedValue(mockTask);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask];
      service.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(result).toEqual(tasks);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      service.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(mockTask.id);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      const updatedTask = { ...mockTask, ...updateDto };
      service.update.mockResolvedValue(updatedTask as TaskResponseDto);

      const result = await controller.update(mockTask.id, updateDto);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(mockTask.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockTask.id);

      expect(service.remove).toHaveBeenCalledWith(mockTask.id);
    });
  });

  describe('search', () => {
    it('should search tasks with filters', async () => {
      const filterDto: TaskFilterDto = {
        project_id: 'project-123',
        statuses: [TaskStatus.PENDING],
      };

      const mockResult = {
        items: [mockTask],
        total: 1,
        limit: 20,
        offset: 0,
      };

      service.findFiltered.mockResolvedValue(mockResult);

      const result = await controller.search(filterDto);

      expect(result).toEqual(mockResult);
      expect(service.findFiltered).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOneWithDetails', () => {
    it('should return task with details', async () => {
      const detailedTask = { ...mockTask, project: {}, user: {} };
      service.findOneWithDetails.mockResolvedValue(detailedTask);

      const result = await controller.findOneWithDetails(mockTask.id);

      expect(result).toEqual(detailedTask);
      expect(service.findOneWithDetails).toHaveBeenCalledWith(mockTask.id);
    });
  });

  describe('history', () => {
    it('should return task history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          task_id: mockTask.id,
          field: 'status',
          old_value: 'pending',
          new_value: 'in-progress',
          changed_by: 'user-123',
          changed_at: new Date(),
        },
      ];

      service.getHistory.mockResolvedValue(mockHistory as any);

      const result = await controller.history(mockTask.id);

      expect(result).toEqual(mockHistory);
      expect(service.getHistory).toHaveBeenCalledWith(mockTask.id);
    });
  });
});
