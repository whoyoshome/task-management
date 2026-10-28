import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LabelService } from './label.service';
import { LabelRepository } from '../repositories/label.repository';
import { Project, Task } from '../entities';

describe('LabelService (Task Microservice)', () => {
  let service: LabelService;

  const mockLabel = {
    id: 'label-1',
    project_id: 'project-1',
    name: 'Bug',
    color: '#ff0000',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  };

  const mockLabelRepository = {
    listByTask: jest.fn(),
    listByProject: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignLabel: jest.fn(),
    removeLabel: jest.fn(),
  };

  const mockProjectRepo = {
    findOne: jest.fn(),
  };

  const mockTaskRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelService,
        { provide: LabelRepository, useValue: mockLabelRepository },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
      ],
    }).compile();

    service = module.get<LabelService>(LabelService);
    jest.clearAllMocks();
  });

  it('should list labels by task', async () => {
    mockTaskRepo.findOne.mockResolvedValue({ id: 'task-1', project_id: 'project-1' });
    mockLabelRepository.listByTask.mockResolvedValue([mockLabel]);

    const result = await service.listByTask('task-1');

    expect(mockTaskRepo.findOne).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    expect(mockLabelRepository.listByTask).toHaveBeenCalledWith('task-1');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'label-1',
        name: 'Bug',
      }),
    ]);
  });

  it('should throw when task does not exist', async () => {
    mockTaskRepo.findOne.mockResolvedValue(null);

    await expect(service.listByTask('missing-task')).rejects.toThrow(
      NotFoundException
    );
  });
});
