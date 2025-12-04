import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { TaskTcpClient } from '@shared/clients';
import {
  RemoteUserValidatorService,
  RemoteProjectValidatorService,
} from '@libs/utils';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskFilterDto,
  TaskPriority,
  TaskStatus,
} from '@shared/contracts';
import { of, throwError } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('TaskService (API Gateway)', () => {
  let service: TaskService;
  let taskTcpClient: jest.Mocked<TaskTcpClient>;
  let userValidator: jest.Mocked<RemoteUserValidatorService>;
  let projectValidator: jest.Mocked<RemoteProjectValidatorService>;

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

  const mockSend = jest.fn();
  const mockTcpClient = {
    getClient: jest.fn().mockReturnValue({
      send: mockSend,
    }),
  };

  const mockUserValidator = {
    validateUserExists: jest.fn(),
  };

  const mockProjectValidator = {
    validateProjectExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: TaskTcpClient,
          useValue: mockTcpClient,
        },
        {
          provide: RemoteUserValidatorService,
          useValue: mockUserValidator,
        },
        {
          provide: RemoteProjectValidatorService,
          useValue: mockProjectValidator,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskTcpClient = module.get(TaskTcpClient);
    userValidator = module.get(RemoteUserValidatorService);
    projectValidator = module.get(RemoteProjectValidatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task after validating users and project', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-123',
        created_by: 'user-123',
        assigned_to: 'user-456',
      };

      userValidator.validateUserExists.mockResolvedValue(undefined);
      projectValidator.validateProjectExists.mockResolvedValue(undefined);
      mockSend.mockReturnValue(of(mockTask));

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(userValidator.validateUserExists).toHaveBeenCalledWith(
        'user-123',
        'created_by'
      );
      expect(userValidator.validateUserExists).toHaveBeenCalledWith(
        'user-456',
        'assigned_to'
      );
      expect(projectValidator.validateProjectExists).toHaveBeenCalledWith(
        'project-123'
      );
      expect(mockSend).toHaveBeenCalledWith({ cmd: 'task_create' }, createDto);
    });

    it('should throw error when user validation fails', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-123',
        created_by: 'invalid-user',
        assigned_to: 'user-456',
      };

      userValidator.validateUserExists.mockRejectedValue(
        new BadRequestException('User not found')
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should throw error when project validation fails', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'invalid-project',
        created_by: 'user-123',
        assigned_to: 'user-456',
      };

      userValidator.validateUserExists.mockResolvedValue(undefined);
      projectValidator.validateProjectExists.mockRejectedValue(
        new BadRequestException('Project not found')
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = [mockTask];
      mockSend.mockReturnValue(of(tasks));

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(mockSend).toHaveBeenCalledWith({ cmd: 'task_find_all' }, {});
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockSend.mockReturnValue(of(mockTask));

      const result = await service.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_find_one' },
        mockTask.id
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      const updatedTask = { ...mockTask, ...updateDto };
      mockSend.mockReturnValue(of(updatedTask));

      const result = await service.update(mockTask.id, updateDto);

      expect(result).toEqual(updatedTask);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_update' },
        { id: mockTask.id, data: updateDto }
      );
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockSend.mockReturnValue(of(undefined));

      await service.remove(mockTask.id);

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_delete' },
        mockTask.id
      );
    });
  });

  describe('findOneWithDetails', () => {
    it('should return task with details', async () => {
      const detailedTask = { ...mockTask, project: {}, user: {} };
      mockSend.mockReturnValue(of(detailedTask));

      const result = await service.findOneWithDetails(mockTask.id);

      expect(result).toEqual(detailedTask);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_find_one_with_details' },
        mockTask.id
      );
    });
  });

  describe('getHistory', () => {
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

      mockSend.mockReturnValue(of(mockHistory));

      const result = await service.getHistory(mockTask.id);

      expect(result).toEqual(mockHistory);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_history_list' },
        mockTask.id
      );
    });
  });

  describe('findFiltered', () => {
    it('should return filtered tasks', async () => {
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

      mockSend.mockReturnValue(of(mockResult));

      const result = await service.findFiltered(filterDto);

      expect(result).toEqual(mockResult);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'task_find_filtered' },
        filterDto
      );
    });
  });
});
