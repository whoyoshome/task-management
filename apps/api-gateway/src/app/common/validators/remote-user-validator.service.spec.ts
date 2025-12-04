import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { RemoteUserValidatorService } from '@libs/utils';
import { UserTcpClient } from '@shared/clients';
import { UserRole } from '@shared/contracts';

describe('RemoteUserValidatorService', () => {
  let service: RemoteUserValidatorService;
  let userTcpClient: jest.Mocked<UserTcpClient>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: UserRole.ADMIN,
    password: 'hashedPassword',
    is_active: true,
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
        RemoteUserValidatorService,
        {
          provide: UserTcpClient,
          useValue: mockTcpClient,
        },
      ],
    }).compile();

    service = module.get<RemoteUserValidatorService>(
      RemoteUserValidatorService
    );
    userTcpClient = module.get(UserTcpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUserExists', () => {
    it('should not throw when user exists', async () => {
      mockSend.mockReturnValue(of(mockUser));

      await expect(
        service.validateUserExists('user-123', 'created_by')
      ).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'get_user_by_id' },
        'user-123'
      );
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockSend.mockReturnValue(throwError(() => new Error('User not found')));

      await expect(
        service.validateUserExists('invalid-user', 'created_by')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.validateUserExists('invalid-user', 'created_by')
      ).rejects.toThrow("The user in 'created_by' does not exist.");
    });

    it('should use the correct label in error message', async () => {
      mockSend.mockReturnValue(throwError(() => new Error('User not found')));

      await expect(
        service.validateUserExists('invalid-user', 'assigned_to')
      ).rejects.toThrow("The user in 'assigned_to' does not exist.");
    });
  });

  describe('validateUserIsAdmin', () => {
    it('should not throw when user is admin', async () => {
      mockSend.mockReturnValue(of(mockUser));

      await expect(
        service.validateUserIsAdmin('user-123')
      ).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'get_user_by_id' },
        'user-123'
      );
    });

    it('should throw BadRequestException when user is not admin', async () => {
      const nonAdminUser = {
        ...mockUser,
        role: UserRole.USER,
      };
      mockSend.mockReturnValue(of(nonAdminUser));

      await expect(service.validateUserIsAdmin('user-123')).rejects.toThrow(
        BadRequestException
      );

      await expect(service.validateUserIsAdmin('user-123')).rejects.toThrow(
        'Only admin users can create a project.'
      );
    });
  });
});
