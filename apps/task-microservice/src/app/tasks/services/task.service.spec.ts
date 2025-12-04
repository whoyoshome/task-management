import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskRepository } from '../repositories/task.repository';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskStatus,
  TaskPriority,
} from '@shared/contracts';
import { Task } from '../entities';

describe('TaskService', () => {
  let service: TaskService;
  let repository: jest.Mocked<TaskRepository>;

  const mockTask: Task = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    project_id: 'project-123',
    created_by: 'user-123',
    assigned_to: 'user-456',
    due_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as Task;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByIdWithRelations: jest.fn(),
    findFiltered: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: TaskRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get(TaskRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-123',
        created_by: 'user-123',
        assigned_to: 'user-456',
      };

      repository.create.mockResolvedValue(mockTask);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          description: createDto.description,
        })
      );
    });

    it('should convert due_date string to Date', async () => {
      const createDto: CreateTaskDto = {
        title: 'Task with due date',
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-123',
        created_by: 'user-123',
        assigned_to: 'user-456',
        due_date: '2024-12-31',
      };

      repository.create.mockResolvedValue(mockTask);

      await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          due_date: expect.any(Date),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a task when found', async () => {
      repository.findById.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(repository.findById).toHaveBeenCalledWith(mockTask.id);
    });

    it('should throw NotFoundException when task not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'another-id' }];
      repository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(result).toHaveLength(2);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
      };

      const updatedTask = { ...mockTask, ...updateDto };
      repository.findById.mockResolvedValue(mockTask);
      repository.update.mockResolvedValue(updatedTask as Task);

      const result = await service.update(mockTask.id, updateDto);

      expect(result).toEqual(updatedTask);
      expect(repository.findById).toHaveBeenCalledWith(mockTask.id);
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      repository.findById.mockResolvedValue(mockTask);
      repository.delete.mockResolvedValue(undefined);

      await service.remove(mockTask.id);

      expect(repository.findById).toHaveBeenCalledWith(mockTask.id);
      expect(repository.delete).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('findFiltered', () => {
    it('should return filtered tasks with pagination', async () => {
      const filterDto: TaskFilterDto = {
        project_id: 'project-123',
        limit: 10,
        offset: 0,
      };

      const mockResult = {
        items: [mockTask],
        total: 1,
      };

      repository.findFiltered.mockResolvedValue(mockResult);

      const result = await service.findFiltered(filterDto);

      expect(result).toEqual({
        items: mockResult.items,
        total: mockResult.total,
        limit: 10,
        offset: 0,
      });
      expect(repository.findFiltered).toHaveBeenCalledWith(filterDto);
    });

    it('should use default pagination values', async () => {
      const filterDto: TaskFilterDto = {
        project_id: 'project-123',
      };

      repository.findFiltered.mockResolvedValue({ items: [], total: 0 });

      const result = await service.findFiltered(filterDto);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });
  });
});
