import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TaskService } from './task.service';
import { TaskRepository } from '../repositories/task.repository';
import { ProjectMembersRepository } from '../repositories/project-members.repository';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskStatus,
  TaskPriority,
} from '@shared/contracts';
import { Task, TaskHistory } from '../entities';

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

  const mockProjectMembersRepository = {
    findByProjectAndUser: jest.fn(),
    create: jest.fn(),
  };

  // Transaction double: create() tags rows with their entity, save() records
  // them and gives new tasks an id.
  const saved: Array<{ entity: unknown; row: any }> = [];
  // Query builder double for the task number: the project lock and MAX().
  const lastNumber = { max: null as number | null };
  const queryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue({ id: 'project-123' }),
    getRawOne: jest.fn(async () => ({ ...lastNumber })),
  };
  const manager = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    create: jest.fn((entity: unknown, data: object) => ({ __entity: entity, ...data })),
    save: jest.fn(async (rows: any) => {
      const list = Array.isArray(rows) ? rows : [rows];
      for (const { __entity, ...row } of list) {
        saved.push({ entity: __entity ?? Task, row });
      }
      if (Array.isArray(rows)) return rows;
      const { __entity: _entity, ...row } = rows;
      return { id: 'saved-id', ...row };
    }),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager)
    ),
  };
  const savedOf = (entity: unknown) =>
    saved.filter((s) => s.entity === entity).map((s) => s.row);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: TaskRepository,
          useValue: mockRepository,
        },
        {
          provide: ProjectMembersRepository,
          useValue: mockProjectMembersRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get(TaskRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    saved.length = 0;
  });

  describe('create', () => {
    const createDto: CreateTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      project_id: 'project-123',
      created_by: 'user-123',
      assigned_to: 'user-456',
    };

    it('should create the task and a "created" history entry', async () => {
      mockProjectMembersRepository.findByProjectAndUser.mockResolvedValue({
        id: 'member-1',
      });

      const result = await service.create(createDto);

      expect(result).toEqual(
        expect.objectContaining({ id: 'saved-id', title: createDto.title })
      );
      expect(savedOf(TaskHistory)).toEqual([
        expect.objectContaining({
          task_id: 'saved-id',
          actor_id: 'user-123',
          message: 'Created the task',
        }),
      ]);
    });

    it('numbers the task after the last one of its project, under a lock', async () => {
      mockProjectMembersRepository.findByProjectAndUser.mockResolvedValue({
        id: 'member-1',
      });

      lastNumber.max = null;
      await service.create(createDto);
      lastNumber.max = 41;
      await service.create(createDto);

      expect(savedOf(Task).map((t) => t.number)).toEqual([1, 42]);
      expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(queryBuilder.where).toHaveBeenCalledWith('p.id = :projectId', {
        projectId: 'project-123',
      });
    });

    it('should convert due_date string to Date', async () => {
      mockProjectMembersRepository.findByProjectAndUser.mockResolvedValue({
        id: 'member-1',
      });

      await service.create({ ...createDto, due_date: '2024-12-31' });

      expect(savedOf(Task)[0].due_date).toEqual(expect.any(Date));
    });

    it('should reject an assignee who is not a project member', async () => {
      mockProjectMembersRepository.findByProjectAndUser.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('The assignee must be a member of the project')
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      // Assigning never grants membership as a side effect.
      expect(mockProjectMembersRepository.create).not.toHaveBeenCalled();
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
    it('should save the task and one history entry per changed field', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM, // unchanged: not recorded
      };
      repository.findById.mockResolvedValue({ ...mockTask });

      const result = await service.update(mockTask.id, updateDto, 'actor-1');

      expect(result).toEqual(expect.objectContaining(updateDto));
      expect(savedOf(TaskHistory)).toEqual([
        expect.objectContaining({
          actor_id: 'actor-1',
          message: 'Changed title from "Test Task" to "Updated Title"',
          metadata: { field: 'title', from: 'Test Task', to: 'Updated Title' },
        }),
        expect.objectContaining({
          actor_id: 'actor-1',
          message: 'Changed status from "pending" to "in-progress"',
        }),
      ]);
    });

    it('should not write history when nothing changes', async () => {
      repository.findById.mockResolvedValue({ ...mockTask });

      await service.update(mockTask.id, { title: mockTask.title }, 'actor-1');

      expect(savedOf(TaskHistory)).toEqual([]);
    });

    it('should reject reassigning to a non-member', async () => {
      repository.findById.mockResolvedValue({ ...mockTask });
      mockProjectMembersRepository.findByProjectAndUser.mockResolvedValue(null);

      await expect(
        service.update(mockTask.id, { assigned_to: 'outsider' }, 'actor-1')
      ).rejects.toThrow('The assignee must be a member of the project');
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject moving a task to another project', async () => {
      repository.findById.mockResolvedValue({ ...mockTask });

      await expect(
        service.update(mockTask.id, { project_id: 'other-project' }, 'actor-1')
      ).rejects.toThrow('A task cannot be moved to another project');
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
