import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProjectRole } from '@shared/contracts';
import { ProjectService } from './project.service';
import { ProjectRepository } from '../repositories/project.repository';
import { Project, ProjectMembers } from '../entities';

describe('ProjectService', () => {
  let service: ProjectService;

  // Minimal EntityManager: create() tags rows with their entity, save()
  // assigns an id to the project and records every saved row.
  const saved: Array<{ entity: unknown; data: any }> = [];
  const manager = {
    create: jest.fn((entity: unknown, data: object) => ({ entity, ...data })),
    save: jest.fn(async (rows: any) => {
      const list = Array.isArray(rows) ? rows : [rows];
      for (const row of list) {
        const { entity, ...data } = row;
        saved.push({ entity, data });
      }
      return Array.isArray(rows) ? rows : { ...rows, id: 'project-1' };
    }),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager)
    ),
  };

  const projectRepository = {
    findAll: jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]),
    findByMember: jest.fn().mockResolvedValue([{ id: 'a' }]),
  };

  beforeEach(async () => {
    saved.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: ProjectRepository, useValue: projectRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProjectService);
  });

  describe('findVisibleTo', () => {
    it('returns only member projects for regular users', async () => {
      await expect(service.findVisibleTo('user-1', false)).resolves.toEqual([
        { id: 'a' },
      ]);
      expect(projectRepository.findByMember).toHaveBeenCalledWith('user-1');
      expect(projectRepository.findAll).not.toHaveBeenCalled();
    });

    it('returns every project for global admins', async () => {
      await expect(service.findVisibleTo('admin-1', true)).resolves.toHaveLength(2);
      expect(projectRepository.findByMember).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Project',
      key: 'PRJ',
      description: 'Description',
      created_by: 'creator-id',
    };

    it('creates the project and its members in one transaction', async () => {
      const project = await service.create({
        ...dto,
        members: [
          { user_id: 'member-id', role: ProjectRole.VIEWER },
          // The creator is always admin, whatever role is requested.
          { user_id: 'creator-id', role: ProjectRole.MEMBER },
        ],
      });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(project.id).toBe('project-1');

      const members = saved
        .filter((row) => row.entity === ProjectMembers)
        .map((row) => row.data);
      expect(members).toEqual(
        expect.arrayContaining([
          { project_id: 'project-1', user_id: 'creator-id', role: ProjectRole.ADMIN },
          { project_id: 'project-1', user_id: 'member-id', role: ProjectRole.VIEWER },
        ])
      );
      expect(members).toHaveLength(2);
      expect(saved.some((row) => row.entity === Project)).toBe(true);
    });

    it('reports a duplicate key as a conflict', async () => {
      dataSource.transaction.mockRejectedValueOnce(
        Object.assign(new Error('duplicate key'), { code: '23505' })
      );

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException("Project with key 'PRJ' already exists")
      );
    });

    it('rethrows other errors so the transaction is rolled back', async () => {
      const failure = new Error('db down');
      dataSource.transaction.mockRejectedValueOnce(failure);

      await expect(service.create(dto)).rejects.toBe(failure);
    });
  });
});
