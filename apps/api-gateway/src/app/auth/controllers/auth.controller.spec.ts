import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockLoginResponse: LoginResponseDto = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
  };

  const mockRefreshResponse: RefreshTokenResponseDto = {
    access_token: 'new-access-token',
    expires_in: 3600,
  };

  const mockService = {
    login: jest.fn(),
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

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto: LoginRequestDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      service.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'refresh-token',
      };

      service.refreshAccessToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refresh(refreshDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(service.refreshAccessToken).toHaveBeenCalledWith(refreshDto);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'refresh-token',
      };

      service.logout.mockResolvedValue(undefined);

      await controller.logout(refreshDto);

      expect(service.logout).toHaveBeenCalledWith(refreshDto.refresh_token);
    });
  });
});
