import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from '../services/project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from '@shared/contracts';
import { RemoteAccessService } from '@libs/utils';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: jest.Mocked<ProjectService>;

  const mockProject: ProjectResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    key: 'PROJ-001',
    description: 'Test Description',
    created_by: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOneWithMembers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
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
      .compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto: CreateProjectDto = {
        name: 'New Project',
        key: 'PROJ-002',
        description: 'New Description',
        created_by: 'user-123',
      };

      service.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockProject);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const projects = [
        mockProject,
        { ...mockProject, id: 'another-id', key: 'PROJ-003' },
      ];
      service.findAll.mockResolvedValue(projects);

      const result = await controller.findAll();

      expect(result).toEqual(projects);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      service.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(mockProject.id);

      expect(result).toEqual(mockProject);
      expect(service.findOne).toHaveBeenCalledWith(mockProject.id);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto: UpdateProjectDto = {
        name: 'Updated Project Name',
        description: 'Updated Description',
      };

      const updatedProject = { ...mockProject, ...updateDto };
      service.update.mockResolvedValue(updatedProject);

      const result = await controller.update(mockProject.id, updateDto);

      expect(result).toEqual(updatedProject);
      expect(service.update).toHaveBeenCalledWith(mockProject.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockProject.id);

      expect(service.remove).toHaveBeenCalledWith(mockProject.id);
    });
  });

  describe('findOneWithMembers', () => {
    it('should return project with members', async () => {
      const projectWithMembers = { ...mockProject, members: [] };
      service.findOneWithMembers.mockResolvedValue(projectWithMembers as any);

      const result = await controller.findOneWithMembers(mockProject.id);

      expect(result).toEqual(projectWithMembers);
      expect(service.findOneWithMembers).toHaveBeenCalledWith(mockProject.id);
    });
  });
});
