import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { AuthService, REUSE_GRACE_MS, hashToken } from './auth.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';
import { RefreshTokenRequestDto } from '@shared/contracts';

describe('AuthService (Auth Microservice)', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;

  const nowInSeconds = () => Math.floor(Date.now() / 1000);
  const ACCESS_TTL = 3600;
  const REFRESH_TTL = 7 * 24 * 3600;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockRefreshRepo = {
    create: jest.fn(),
    findByToken: jest.fn(),
    markUsed: jest.fn(),
    deleteByToken: jest.fn(),
    deleteExpired: jest.fn().mockResolvedValue(undefined),
    deleteByUserId: jest.fn().mockResolvedValue(undefined),
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

  // sign() returns "<kind>-token-<n>"; decode() derives exp from the kind so
  // expiry handling can be asserted without real JWTs.
  const stubSigning = () => {
    let counter = 0;
    jwtService.sign.mockImplementation((_payload, options: any) => {
      counter++;
      return options.secret === 'test-refresh-secret'
        ? `refresh-token-${counter}`
        : `access-token-${counter}`;
    });
    jwtService.decode.mockImplementation((token: string) => ({
      exp:
        nowInSeconds() +
        (token.startsWith('refresh') ? REFRESH_TTL : ACCESS_TTL),
    }));
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenRepository, useValue: mockRefreshRepo },
        { provide: RevokedTokenRepository, useValue: mockRevokedRepo },
        { provide: EnvironmentService, useValue: mockEnvService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    stubSigning();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should issue tokens and store only the refresh token hash', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = 'user';
      const full_name = 'Test User';

      const result = await service.generateTokens(
        userId,
        email,
        role,
        full_name
      );

      expect(result.access_token).toBe('access-token-1');
      expect(result.refresh_token).toBe('refresh-token-2');
      expect(result.expires_in).toBeGreaterThan(ACCESS_TTL - 5);
      expect(result.expires_in).toBeLessThanOrEqual(ACCESS_TTL);
      // The gateway uses it as the refresh cookie's lifetime.
      expect(result.refresh_expires_in).toBeGreaterThan(REFRESH_TTL - 5);
      expect(result.refresh_expires_in).toBeLessThanOrEqual(REFRESH_TTL);

      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ sub: userId, email, role, full_name }),
        { secret: 'test-secret', expiresIn: '1h' }
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ sub: userId, email, role, full_name }),
        { secret: 'test-refresh-secret', expiresIn: '7d' }
      );

      const stored = mockRefreshRepo.create.mock.calls[0][0];
      expect(stored.user_id).toBe(userId);
      expect(stored.token).toBe(hashToken('refresh-token-2'));
      expect(stored.token).not.toContain('refresh-token');
      const ttlMs = stored.expires_at.getTime() - Date.now();
      expect(ttlMs).toBeGreaterThan((REFRESH_TTL - 5) * 1000);
    });

    it('should keep the user other sessions on login', async () => {
      await service.generateTokens('user-123', 'a@b.com', 'user', 'A');

      expect(mockRefreshRepo.deleteByUserId).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    const refreshDto: RefreshTokenRequestDto = {
      refresh_token: 'valid-refresh-token',
    };

    const storedToken = (overrides: Partial<RefreshToken> = {}) =>
      ({ id: 'token-id', user_id: 'user-123', used_at: null, ...overrides }) as RefreshToken;

    it('should rotate the refresh token and return a new pair', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        full_name: 'Test User',
      };

      mockRevokedRepo.isRevoked.mockResolvedValue(false);
      mockRefreshRepo.findByToken.mockResolvedValue(storedToken());
      mockRefreshRepo.markUsed.mockResolvedValue(true);
      jwtService.verify.mockReturnValue(mockPayload as any);

      const result = await service.refreshAccessToken(refreshDto);

      const oldHash = hashToken(refreshDto.refresh_token);
      expect(mockRevokedRepo.isRevoked).toHaveBeenCalledWith(oldHash);
      expect(mockRefreshRepo.findByToken).toHaveBeenCalledWith(oldHash);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshDto.refresh_token, {
        secret: 'test-refresh-secret',
      });
      // Kept as used (not deleted) so a later reuse can be detected.
      expect(mockRefreshRepo.markUsed).toHaveBeenCalledWith(oldHash);
      expect(mockRefreshRepo.deleteByToken).not.toHaveBeenCalled();

      expect(result.access_token).toBe('access-token-1');
      expect(result.refresh_token).toBe('refresh-token-2');
      expect(mockRefreshRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          token: hashToken('refresh-token-2'),
        })
      );
    });

    it('should throw RpcException when token is revoked', async () => {
      mockRevokedRepo.isRevoked.mockResolvedValue(true);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        RpcException
      );
      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw RpcException when token not found in repository', async () => {
      mockRevokedRepo.isRevoked.mockResolvedValue(false);
      mockRefreshRepo.findByToken.mockResolvedValue(null);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Invalid refresh token'
      );
      expect(mockRefreshRepo.deleteByToken).not.toHaveBeenCalled();
    });

    it('should not rotate when the token signature or expiry is invalid', async () => {
      mockRevokedRepo.isRevoked.mockResolvedValue(false);
      mockRefreshRepo.findByToken.mockResolvedValue(storedToken());
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
      expect(mockRefreshRepo.markUsed).not.toHaveBeenCalled();
      expect(mockRefreshRepo.create).not.toHaveBeenCalled();
    });

    describe('reuse of a rotated token', () => {
      beforeEach(() => {
        mockRevokedRepo.isRevoked.mockResolvedValue(false);
      });

      it('revokes every session of the user', async () => {
        mockRefreshRepo.findByToken.mockResolvedValue(
          storedToken({ used_at: new Date(Date.now() - REUSE_GRACE_MS - 1000) })
        );

        await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
          'Refresh token has already been used'
        );
        expect(mockRefreshRepo.deleteByUserId).toHaveBeenCalledWith('user-123');
        expect(mockRefreshRepo.create).not.toHaveBeenCalled();
      });

      it('only rejects the request within the grace period (concurrent tabs)', async () => {
        mockRefreshRepo.findByToken.mockResolvedValue(
          storedToken({ used_at: new Date(Date.now() - 1000) })
        );

        await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
          'Refresh token has already been used'
        );
        expect(mockRefreshRepo.deleteByUserId).not.toHaveBeenCalled();
      });

      it('rejects the loser of two simultaneous refreshes without revoking', async () => {
        mockRefreshRepo.findByToken.mockResolvedValue(storedToken());
        jwtService.verify.mockReturnValue({ sub: 'user-123' } as any);
        mockRefreshRepo.markUsed.mockResolvedValue(false);

        await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
          'Refresh token has already been used'
        );
        expect(mockRefreshRepo.deleteByUserId).not.toHaveBeenCalled();
        expect(mockRefreshRepo.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('logout', () => {
    it('should revoke and delete the token by its hash', async () => {
      const refreshToken = 'refresh-token-to-revoke';

      await service.logout(refreshToken);

      expect(mockRevokedRepo.create).toHaveBeenCalledWith(
        hashToken(refreshToken)
      );
      expect(mockRefreshRepo.deleteByToken).toHaveBeenCalledWith(
        hashToken(refreshToken)
      );
    });
  });
});
