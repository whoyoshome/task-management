import { Test, TestingModule } from '@nestjs/testing';
import { RemoteAccessService } from '@libs/utils';
import { TaskTcpClient } from '@shared/clients';
import { of } from 'rxjs';

describe('RemoteAccessService', () => {
  let service: RemoteAccessService;
  let taskTcpClient: jest.Mocked<TaskTcpClient>;

  const mockSend = jest.fn();
  const mockTcpClient = {
    getClient: jest.fn().mockReturnValue({
      send: mockSend,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoteAccessService,
        {
          provide: TaskTcpClient,
          useValue: mockTcpClient,
        },
      ],
    }).compile();

    service = module.get<RemoteAccessService>(RemoteAccessService);
    taskTcpClient = module.get(TaskTcpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMemberRole', () => {
    it('should return member role', async () => {
      mockSend.mockReturnValue(of('member'));

      const result = await service.getMemberRole('project-123', 'user-123');

      expect(result).toBe('member');
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_member_get_role' },
        { project_id: 'project-123', user_id: 'user-123' }
      );
    });

    it('should return admin role', async () => {
      mockSend.mockReturnValue(of('admin'));

      const result = await service.getMemberRole('project-123', 'user-456');

      expect(result).toBe('admin');
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'project_member_get_role' },
        { project_id: 'project-123', user_id: 'user-456' }
      );
    });

    it('should return viewer role', async () => {
      mockSend.mockReturnValue(of('viewer'));

      const result = await service.getMemberRole('project-123', 'user-789');

      expect(result).toBe('viewer');
    });

    it('should return null when user is not a member', async () => {
      mockSend.mockReturnValue(of(null));

      const result = await service.getMemberRole('project-123', 'user-999');

      expect(result).toBeNull();
    });
  });

  describe('resolveProjectId', () => {
    it('should resolve project_id from task', async () => {
      mockSend.mockReturnValue(of('project-123'));

      const result = await service.resolveProjectId('task', 'task-123');

      expect(result).toBe('project-123');
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'access_resolve_project' },
        { resource: 'task', id: 'task-123' }
      );
    });

    it('should resolve project_id from sprint', async () => {
      mockSend.mockReturnValue(of('project-456'));

      const result = await service.resolveProjectId('sprint', 'sprint-123');

      expect(result).toBe('project-456');
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'access_resolve_project' },
        { resource: 'sprint', id: 'sprint-123' }
      );
    });

    it('should resolve project_id from board', async () => {
      mockSend.mockReturnValue(of('project-789'));

      const result = await service.resolveProjectId('board', 'board-123');

      expect(result).toBe('project-789');
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'access_resolve_project' },
        { resource: 'board', id: 'board-123' }
      );
    });

    it('should return null when resource does not exist', async () => {
      mockSend.mockReturnValue(of(null));

      const result = await service.resolveProjectId(
        'task',
        'non-existent-task'
      );

      expect(result).toBeNull();
    });

    it('should handle different resource types', async () => {
      const resourceTypes = [
        'task',
        'sprint',
        'board',
        'board_column',
        'label',
        'project_member',
      ];

      for (const resource of resourceTypes) {
        mockSend.mockReturnValue(of(`project-for-${resource}`));
        const result = await service.resolveProjectId(
          resource,
          `${resource}-123`
        );
        expect(result).toBe(`project-for-${resource}`);
      }
    });
  });
});
