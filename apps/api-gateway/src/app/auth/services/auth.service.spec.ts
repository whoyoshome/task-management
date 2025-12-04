import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserTcpClient, AuthTcpClient } from '@shared/clients';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';
import { of } from 'rxjs';


describe('AuthService (API Gateway)', () => {
  let service: AuthService;
  let userTcpClient: jest.Mocked<UserTcpClient>;
  let authTcpClient: jest.Mocked<AuthTcpClient>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: 'user',
    full_name: 'Test User',
  };

  const mockTokens: LoginResponseDto = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
  };

  const mockUserSend = jest.fn();
  const mockAuthSend = jest.fn();
  const mockUserClient = {
    getClient: jest.fn().mockReturnValue({
      send: mockUserSend,
    }),
  };

  const mockAuthClient = {
    getClient: jest.fn().mockReturnValue({
      send: mockAuthSend,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserTcpClient,
          useValue: mockUserClient,
        },
        {
          provide: AuthTcpClient,
          useValue: mockAuthClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userTcpClient = module.get(UserTcpClient);
    authTcpClient = module.get(AuthTcpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginRequestDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockUserSend.mockReturnValue(of(mockUser));
      mockAuthSend.mockReturnValue(of(mockTokens));

      const result = await service.login(loginDto);

      expect(result).toEqual(mockTokens);
      expect(mockUserSend).toHaveBeenCalledWith(
        { cmd: 'get_user_by_email' },
        loginDto.email
      );

      expect(mockAuthSend).toHaveBeenCalledWith(
        { cmd: 'generate_tokens' },
        {
          user_id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          full_name: mockUser.full_name,
        }
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: LoginRequestDto = {
        email: 'notfound@example.com',
        password: 'Password123!',
      };

      mockUserSend.mockReturnValue(of(null));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(mockAuthSend).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'refresh-token',
      };

      const newTokens: RefreshTokenResponseDto = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      mockAuthSend.mockReturnValue(of(newTokens));

      const result = await service.refreshAccessToken(refreshDto);

      expect(result).toEqual(newTokens);
      expect(mockAuthSend).toHaveBeenCalledWith(
        { cmd: 'refresh_token' },
        refreshDto
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = 'refresh-token';
      mockAuthSend.mockReturnValue(of(undefined));

      await service.logout(refreshToken);

      expect(mockAuthSend).toHaveBeenCalledWith(
        { cmd: 'logout' },
        refreshToken
      );
    });
  });
});
