import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';
import { IssuedTokens, RefreshTokenRequestDto } from '@shared/contracts';

interface TokenClaims {
  sub: string;
  email: string;
  role: string;
  full_name: string;
}

// Refresh tokens are persisted only as hashes, so a database leak does not
// expose usable tokens. They are long random JWTs, so SHA-256 is enough.
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

// How long after a rotation a second use of the old refresh token is taken
// for a concurrent refresh rather than a stolen token.
export const REUSE_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshRepo: RefreshTokenRepository,
    private readonly revokedRepo: RevokedTokenRepository,
    private readonly env: EnvironmentService
  ) {}

  async generateTokens(
    userId: string,
    email: string,
    role: string,
    full_name: string
  ): Promise<IssuedTokens> {
    try {
      await this.refreshRepo.deleteExpired();
    } catch (error) {
      // Housekeeping only: never block a login because of it.
      this.logger.warn(`Failed to delete expired tokens: ${String(error)}`);
    }

    return this.issueTokens({ sub: userId, email, role, full_name });
  }

  async refreshAccessToken(
    dto: RefreshTokenRequestDto
  ): Promise<IssuedTokens> {
    const tokenHash = hashToken(dto.refresh_token);

    const isRevoked = await this.revokedRepo.isRevoked(tokenHash);
    if (isRevoked) {
      throw new RpcException({
        statusCode: 401,
        message: 'Token has been revoked',
      });
    }

    const stored = await this.refreshRepo.findByToken(tokenHash);
    if (!stored) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }
    if (stored.used_at) {
      return this.rejectReuse(stored);
    }

    let payload: TokenClaims;
    try {
      payload = this.jwtService.verify<TokenClaims>(dto.refresh_token, {
        secret: this.env.getJwtRefreshSecret(),
      });
    } catch {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    }

    // Rotation: each refresh token can be used once. Losing this race means
    // a concurrent request has just used it.
    if (!(await this.refreshRepo.markUsed(tokenHash))) {
      return this.rejectReuse({ ...stored, used_at: new Date() });
    }

    return this.issueTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.revokedRepo.create(tokenHash);
    await this.refreshRepo.deleteByToken(tokenHash);
  }

  /**
   * A rotated token was presented again. Its owner already holds the newer
   * one, so the likely sender is whoever stole it: revoke every session of
   * the user. Within the grace period it is more likely two tabs refreshing
   * at once, and only that request is rejected.
   */
  private async rejectReuse(stored: RefreshToken): Promise<never> {
    const usedAt = stored.used_at?.getTime() ?? Date.now();
    if (Date.now() - usedAt > REUSE_GRACE_MS) {
      await this.refreshRepo.deleteByUserId(stored.user_id);
      this.logger.warn(
        `Refresh token reused for user ${stored.user_id}: all of their sessions were revoked`
      );
    }
    throw new RpcException({
      statusCode: 401,
      message: 'Refresh token has already been used',
    });
  }

  private async issueTokens(claims: TokenClaims): Promise<IssuedTokens> {
    const access_token = this.jwtService.sign(
      { ...claims, jti: randomUUID() },
      {
        secret: this.env.getJwtSecret(),
        expiresIn: this.env.getJwtExpiresIn(),
      }
    );

    const refresh_token = this.jwtService.sign(
      { ...claims, jti: randomUUID() },
      {
        secret: this.env.getJwtRefreshSecret(),
        expiresIn: this.env.getJwtRefreshExpiresIn(),
      }
    );

    await this.refreshRepo.create({
      user_id: claims.sub,
      token: hashToken(refresh_token),
      expires_at: new Date(this.expiryOf(refresh_token) * 1000),
    });

    return {
      access_token,
      expires_in: this.secondsLeft(access_token),
      refresh_token,
      refresh_expires_in: this.secondsLeft(refresh_token),
    };
  }

  /** Expiry of a freshly signed token, in seconds since the epoch. */
  private expiryOf(token: string): number {
    const { exp } = this.jwtService.decode<{ exp: number }>(token);
    return exp;
  }

  private secondsLeft(token: string): number {
    return Math.max(0, this.expiryOf(token) - Math.floor(Date.now() / 1000));
  }
}
