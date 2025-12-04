import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { RemoteProjectValidatorService } from '@libs/utils';
import { TaskTcpClient } from '@shared/clients';

describe('RemoteProjectValidatorService', () => {
  let service: RemoteProjectValidatorService;
  let taskTcpClient: jest.Mocked<TaskTcpClient>;

  const mockProject = {
    id: '11111111-1111-1111-1111-111111111111',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoteProjectValidatorService,
        {
          provide: TaskTcpClient,
          useValue: mockTcpClient,
        },
      ],
    }).compile();

    service = module.get<RemoteProjectValidatorService>(
      RemoteProjectValidatorService
    );
    taskTcpClient = module.get(TaskTcpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateProjectExists', () => {
    it('should not throw when project exists', async () => {
      mockSend.mockReturnValue(of(mockProject));

      await expect(
        service.validateProjectExists('11111111-1111-1111-1111-111111111111')
      ).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_find_one' },
        '11111111-1111-1111-1111-111111111111'
      );
    });

    it('should throw BadRequestException when project does not exist', async () => {
      const validUUID = '99999999-9999-9999-9999-999999999999';

      mockSend.mockReturnValue(
        throwError(() => ({
          statusCode: 404,
          message: 'Project not found',
        }))
      );

      await expect(service.validateProjectExists(validUUID)).rejects.toThrow(
        BadRequestException
      );

      await expect(service.validateProjectExists(validUUID)).rejects.toThrow(
        'The project_id provided does not exist.'
      );
    });
    it('should throw BadRequestException when project_id format is invalid', async () => {
      await expect(
        service.validateProjectExists('invalid-project')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.validateProjectExists('invalid-project')
      ).rejects.toThrow('Invalid project_id format: invalid-project');
    });

    it('should handle network errors with valid UUID', async () => {
      const validUUID = '88888888-8888-8888-8888-888888888888';

      mockSend.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.validateProjectExists(validUUID)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
