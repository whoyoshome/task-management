import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '@shared/contracts';
import { User } from '../entities/user.entity';
import { UserRole } from '@shared/contracts';

describe('UserController (User Microservice)', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    full_name: 'Test User',
    role: UserRole.USER,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        full_name: 'New User',
        role: UserRole.USER,
      };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 'another-id', email: 'another@example.com' },
      ];
      service.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto: UpdateUserDto = {
        full_name: 'Updated Name',
        password: 'NewPassword123!',
      };

      const updatePayload = {
        id: mockUser.id,
        dto: updateDto,
      };

      const updatedUser = { ...mockUser, ...updateDto };
      service.update.mockResolvedValue(updatedUser as User);

      const result = await controller.update(updatePayload);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockUser.id);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user when found by email', async () => {
      service.findByEmail.mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(service.findByEmail).toHaveBeenCalledWith(mockUser.email);
    });

    it('should return null when user not found by email', async () => {
      service.findByEmail.mockResolvedValue(null);

      const result = await controller.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(service.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return a user by id', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
