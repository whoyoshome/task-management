import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, UserRole } from '@shared/contracts';
import { User } from '../entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UserService (User Microservice)', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    full_name: 'Test User',
    role: UserRole.USER,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        full_name: 'New User',
        role: UserRole.USER,
      };

      const hashedPassword = '$2b$10$hashedpassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        password: hashedPassword,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 'another-id', email: 'another@example.com' },
      ];
      mockRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateDto: UpdateUserDto = {
        full_name: 'Updated Name',
        email: 'updated@example.com',
        password: 'NewPassword123!',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(updatedUser as User);

      const result = await service.update(mockUser.id, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', {
          full_name: 'Updated',
          password: 'NewPassword123!',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(mockUser.id);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
    });

    it('should return null when user not found by email', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        'notfound@example.com'
      );
    });
  });
});
