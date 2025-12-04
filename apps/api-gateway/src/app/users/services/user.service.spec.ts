import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserTcpClient } from '@shared/clients';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '@shared/contracts';
import { UserRole } from '@shared/contracts';
import { of } from 'rxjs';

describe('UserService (API Gateway)', () => {
  let service: UserService;
  let userTcpClient: jest.Mocked<UserTcpClient>;

  const mockUser: UserResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    full_name: 'Test User',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
        UserService,
        {
          provide: UserTcpClient,
          useValue: mockTcpClient,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userTcpClient = module.get(UserTcpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        full_name: 'New User',
        role: UserRole.USER,
      };

      mockSend.mockReturnValue(of(mockUser));

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalledWith({ cmd: 'create_user' }, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 'another-id', email: 'another@example.com' },
      ];
      mockSend.mockReturnValue(of(users));

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
      expect(mockSend).toHaveBeenCalledWith({ cmd: 'get_all_users' }, {});
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockSend.mockReturnValue(of(mockUser));

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'get_user_by_id' },
        mockUser.id
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto: UpdateUserDto = {
        full_name: 'Updated Name',
        email: 'updated@example.com',
        password: 'NewPassword123!',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      mockSend.mockReturnValue(of(updatedUser));

      const result = await service.update(mockUser.id, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'update_user' },
        { id: mockUser.id, dto: updateDto }
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockSend.mockReturnValue(of(undefined));

      await service.remove(mockUser.id);

      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'delete_user' },
        mockUser.id
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user by userId', async () => {
      mockSend.mockReturnValue(of(mockUser));

      const result = await service.getCurrentUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalledWith(
        { cmd: 'get_current_user' },
        mockUser.id
      );
    });
  });
});
