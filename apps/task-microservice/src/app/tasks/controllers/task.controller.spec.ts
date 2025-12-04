import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskStatus,
  TaskPriority,
} from '@shared/contracts';
import { Task } from '../entities';

describe('TaskController (Task Microservice)', () => {
  let controller: TaskController;
  let service: jest.Mocked<TaskService>;

  const mockTask: Task = {
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
  } as Task;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findFiltered: jest.fn(),
    findOneWithDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockService,
        },
      ],
    }).compile();

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
      const tasks = [mockTask, { ...mockTask, id: 'another-id' }];
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
        status: TaskStatus.IN_PROGRESS,
      };

      const updatePayload = {
        id: mockTask.id,
        data: updateDto,
      };

      const updatedTask = { ...mockTask, ...updateDto };
      service.update.mockResolvedValue(updatedTask as Task);

      const result = await controller.update(updatePayload);

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

  describe('findFiltered', () => {
    it('should return filtered tasks', async () => {
      const filterDto: TaskFilterDto = {
        project_id: 'project-123',
        statuses: [TaskStatus.PENDING],
        limit: 10,
        offset: 0,
      };

      const mockResult = {
        items: [mockTask],
        total: 1,
        limit: 10,
        offset: 0,
      };

      service.findFiltered.mockResolvedValue(mockResult);

      const result = await controller.findFiltered(filterDto);

      expect(result).toEqual(mockResult);
      expect(service.findFiltered).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOneWithDetails', () => {
    it('should return task with details', async () => {
      const detailedTask = {
        ...mockTask,
        project: {} as any,
        user: {} as any,
      };
      service.findOneWithDetails.mockResolvedValue(detailedTask as Task);

      const result = await controller.findOneWithDetails(mockTask.id);

      expect(result).toEqual(detailedTask);
      expect(service.findOneWithDetails).toHaveBeenCalledWith(mockTask.id);
    });
  });
});
