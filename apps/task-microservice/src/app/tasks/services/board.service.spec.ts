import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SprintStatus, TaskStatus } from '@shared/contracts';
import { BoardService } from './board.service';
import { BoardRepository } from '../repositories/board.repository';
import { Project, Sprint, Task, TaskHistory } from '../entities';

describe('BoardService.moveTask', () => {
  let service: BoardService;

  const boardRepo = { findBoardById: jest.fn(), findColumn: jest.fn() };
  const taskRepo = { findOne: jest.fn() };
  const sprintRepo = { findOne: jest.fn() };
  const manager = {
    create: jest.fn((entity: unknown, data: object) => ({ entity, ...data })),
    save: jest.fn(async (row: unknown) => row),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager)
    ),
  };

  const task = () => ({
    id: 'task-1',
    project_id: 'project-1',
    status: TaskStatus.PENDING,
    sprint_id: 'sprint-1' as string | null,
    sprint_order_index: 3 as number | null,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    boardRepo.findBoardById.mockResolvedValue({
      id: 'board-1',
      project_id: 'project-1',
    });
    boardRepo.findColumn.mockResolvedValue({ id: 'col-1' });
    sprintRepo.findOne.mockResolvedValue({ status: SprintStatus.ACTIVE });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: BoardRepository, useValue: boardRepo },
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(Sprint), useValue: sprintRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(BoardService);
  });

  it('updates the status inside a transaction', async () => {
    taskRepo.findOne.mockResolvedValue(task());

    const moved = await service.moveTask('task-1', 'board-1', TaskStatus.IN_PROGRESS);

    expect(moved).toEqual(
      expect.objectContaining({ status: TaskStatus.IN_PROGRESS, sprint_id: 'sprint-1' })
    );
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.create).not.toHaveBeenCalled();
  });

  it('detaches from a closed sprint and records history atomically', async () => {
    taskRepo.findOne.mockResolvedValue(task());
    sprintRepo.findOne.mockResolvedValue({ status: SprintStatus.CLOSED });

    const moved = await service.moveTask('task-1', 'board-1', TaskStatus.IN_PROGRESS);

    expect(moved).toEqual(
      expect.objectContaining({ sprint_id: null, sprint_order_index: null })
    );
    expect(manager.create).toHaveBeenCalledWith(
      TaskHistory,
      expect.objectContaining({ task_id: 'task-1', type: 'system' })
    );
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('writes nothing when the board belongs to another project', async () => {
    taskRepo.findOne.mockResolvedValue(task());
    sprintRepo.findOne.mockResolvedValue({ status: SprintStatus.CLOSED });
    boardRepo.findBoardById.mockResolvedValue({
      id: 'board-2',
      project_id: 'other-project',
    });

    await expect(
      service.moveTask('task-1', 'board-2', TaskStatus.IN_PROGRESS)
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('writes nothing when the status is not a column of the board', async () => {
    taskRepo.findOne.mockResolvedValue(task());
    boardRepo.findColumn.mockResolvedValue(null);

    await expect(
      service.moveTask('task-1', 'board-1', TaskStatus.COMPLETED)
    ).rejects.toThrow('Status not allowed in this board');
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('fails with NotFound when the task does not exist', async () => {
    taskRepo.findOne.mockResolvedValue(null);

    await expect(
      service.moveTask('missing', 'board-1', TaskStatus.IN_PROGRESS)
    ).rejects.toThrow(NotFoundException);
  });
});
