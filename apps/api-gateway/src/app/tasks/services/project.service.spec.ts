import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { TaskTcpClient } from '@shared/clients';
import { RemoteUserValidatorService } from '@libs/utils';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from '@shared/contracts';
import { of } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('ProjectService (API Gateway)', () => {
  let service: ProjectService;
  let taskTcpClient: jest.Mocked<TaskTcpClient>;
  let userValidator: jest.Mocked<RemoteUserValidatorService>;

  const mockProject: ProjectResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    key: 'PROJ-001',
    description: 'Test Description',
    created_by: 'user-123',
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
    validateUserIsAdmin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: TaskTcpClient,
          useValue: mockTcpClient,
        },
        {
          provide: RemoteUserValidatorService,
          useValue: mockUserValidator,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    taskTcpClient = module.get(TaskTcpClient);
    userValidator = module.get(RemoteUserValidatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project after validating user exists and is admin', async () => {
      const createDto: CreateProjectDto = {
        name: 'New Project',
        key: 'PROJ-002',
        description: 'New Description',
        created_by: 'user-123',
      };

      userValidator.validateUserExists.mockResolvedValue(undefined);
      userValidator.validateUserIsAdmin.mockResolvedValue(undefined);
      mockSend.mockReturnValue(of(mockProject));

      const result = await service.create(createDto);

      expect(result).toEqual(mockProject);
      expect(userValidator.validateUserExists).toHaveBeenCalledWith(
        'user-123',
        'created_by'
      );
      expect(userValidator.validateUserIsAdmin).toHaveBeenCalledWith(
        'user-123'
      );
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_create' },
        createDto
      );
    });

    it('should throw error when user validation fails', async () => {
      const createDto: CreateProjectDto = {
        name: 'New Project',
        key: 'PROJ-002',
        description: 'New Description',
        created_by: 'invalid-user',
      };

      userValidator.validateUserExists.mockRejectedValue(
        new BadRequestException('User not found')
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
      expect(userValidator.validateUserIsAdmin).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should throw error when user is not admin', async () => {
      const createDto: CreateProjectDto = {
        name: 'New Project',
        key: 'PROJ-002',
        description: 'New Description',
        created_by: 'user-123',
      };

      userValidator.validateUserExists.mockResolvedValue(undefined);
      userValidator.validateUserIsAdmin.mockRejectedValue(
        new BadRequestException('Only admin users can create a project.')
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException
      );
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const projects = [
        mockProject,
        { ...mockProject, id: 'another-id', key: 'PROJ-003' },
      ];
      mockSend.mockReturnValue(of(projects));

      const result = await service.findAll();

      expect(result).toEqual(projects);
      expect(result).toHaveLength(2);
      expect(mockSend).toHaveBeenCalledWith({ cmd: 'project_find_all' }, {});
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockSend.mockReturnValue(of(mockProject));

      const result = await service.findOne(mockProject.id);

      expect(result).toEqual(mockProject);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_find_one' },
        mockProject.id
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto: UpdateProjectDto = {
        name: 'Updated Project Name',
        description: 'Updated Description',
      };

      const updatedProject = { ...mockProject, ...updateDto };
      mockSend.mockReturnValue(of(updatedProject));

      const result = await service.update(mockProject.id, updateDto);

      expect(result).toEqual(updatedProject);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_update' },
        { id: mockProject.id, data: updateDto }
      );
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockSend.mockReturnValue(of(undefined));

      await service.remove(mockProject.id);

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_delete' },
        mockProject.id
      );
    });
  });

  describe('findOneWithMembers', () => {
    it('should return project with members', async () => {
      const projectWithMembers = { ...mockProject, members: [] };
      mockSend.mockReturnValue(of(projectWithMembers));

      const result = await service.findOneWithMembers(mockProject.id);

      expect(result).toEqual(projectWithMembers);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_find_one_with_members' },
        mockProject.id
      );
    });
  });
});
