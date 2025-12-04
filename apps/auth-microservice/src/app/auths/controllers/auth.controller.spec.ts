import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import {
  RefreshTokenRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';

describe('AuthController (Auth Microservice)', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockLoginResponse: LoginResponseDto = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
  };

  const mockRefreshResponse: RefreshTokenResponseDto = {
    access_token: 'new-access-token',
    expires_in: 3600,
  };

  const mockService = {
    generateTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate tokens for a user', async () => {
      const payload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user',
        full_name: 'Test User',
      };

      service.generateTokens.mockResolvedValue(mockLoginResponse);

      const result = await controller.generateTokens(payload);

      expect(result).toEqual(mockLoginResponse);
      expect(service.generateTokens).toHaveBeenCalledWith(
        payload.user_id,
        payload.email,
        payload.role,
        payload.full_name
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'valid-refresh-token',
      };

      service.refreshAccessToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refreshAccessToken(refreshDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(service.refreshAccessToken).toHaveBeenCalledWith(refreshDto);
    });
  });

  describe('logout', () => {
    it('should logout and return success', async () => {
      const refreshToken = 'refresh-token-to-revoke';

      service.logout.mockResolvedValue(undefined);

      const result = await controller.logout(refreshToken);

      expect(result).toEqual({ success: true });
      expect(service.logout).toHaveBeenCalledWith(refreshToken);
    });
  });
});
