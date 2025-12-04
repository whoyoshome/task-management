import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';
import { RefreshTokenRequestDto } from '@shared/contracts';

describe('AuthService (Auth Microservice)', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let refreshRepo: jest.Mocked<RefreshTokenRepository>;
  let revokedRepo: jest.Mocked<RevokedTokenRepository>;
  let envService: jest.Mocked<EnvironmentService>;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockRefreshRepo = {
    create: jest.fn(),
    findByToken: jest.fn(),
    deleteByToken: jest.fn(),
  };

  const mockRevokedRepo = {
    isRevoked: jest.fn(),
    create: jest.fn(),
  };

  const mockEnvService = {
    getJwtSecret: jest.fn().mockReturnValue('test-secret'),
    getJwtExpiresIn: jest.fn().mockReturnValue('1h'),
    getJwtRefreshSecret: jest.fn().mockReturnValue('test-refresh-secret'),
    getJwtRefreshExpiresIn: jest.fn().mockReturnValue('7d'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRefreshRepo,
        },
        {
          provide: RevokedTokenRepository,
          useValue: mockRevokedRepo,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    refreshRepo = module.get(RefreshTokenRepository);
    revokedRepo = module.get(RevokedTokenRepository);
    envService = module.get(EnvironmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens successfully', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = 'user';
      const full_name = 'Test User';

      const mockAccessToken = 'access-token-123';
      const mockRefreshToken = 'refresh-token-123';

      jwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      mockRefreshRepo.create.mockResolvedValue({
        id: 'token-id',
        user_id: userId,
        token: mockRefreshToken,
        expires_at: new Date(),
        created_at: new Date(),
      } as any);

      const result = await service.generateTokens(
        userId,
        email,
        role,
        full_name
      );

      expect(result).toEqual({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email, role, full_name },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        }
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: userId, email, role, full_name },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        }
      );
      expect(mockRefreshRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          token: mockRefreshToken,
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'valid-refresh-token',
      };

      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        full_name: 'Test User',
      };

      const mockNewAccessToken = 'new-access-token';

      mockRevokedRepo.isRevoked.mockResolvedValue(false);
      mockRefreshRepo.findByToken.mockResolvedValue({
        id: 'token-id',
        user_id: 'user-123',
        token: 'valid-refresh-token',
        expires_at: new Date(Date.now() + 1000000),
      } as any);
      jwtService.verify.mockReturnValue(mockPayload as any);
      jwtService.sign.mockReturnValue(mockNewAccessToken);

      const result = await service.refreshAccessToken(refreshDto);

      expect(result).toEqual({
        access_token: mockNewAccessToken,
        expires_in: 3600,
      });

      expect(mockRevokedRepo.isRevoked).toHaveBeenCalledWith(
        refreshDto.refresh_token
      );
      expect(mockRefreshRepo.findByToken).toHaveBeenCalledWith(
        refreshDto.refresh_token
      );
      expect(jwtService.verify).toHaveBeenCalledWith(refreshDto.refresh_token, {
        secret: 'test-refresh-secret',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockPayload.sub,
          email: mockPayload.email,
          role: mockPayload.role,
          full_name: mockPayload.full_name,
        },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        }
      );
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'revoked-token',
      };

      mockRevokedRepo.isRevoked.mockResolvedValue(true);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw UnauthorizedException when token not found in repository', async () => {
      const refreshDto: RefreshTokenRequestDto = {
        refresh_token: 'invalid-token',
      };

      mockRevokedRepo.isRevoked.mockResolvedValue(false);
      mockRefreshRepo.findByToken.mockResolvedValue(null);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully by revoking token', async () => {
      const refreshToken = 'refresh-token-to-revoke';

      mockRevokedRepo.create.mockResolvedValue(undefined);
      mockRefreshRepo.deleteByToken.mockResolvedValue(undefined);

      await service.logout(refreshToken);

      expect(mockRevokedRepo.create).toHaveBeenCalledWith(refreshToken);
      expect(mockRefreshRepo.deleteByToken).toHaveBeenCalledWith(refreshToken);
    });
  });
});
