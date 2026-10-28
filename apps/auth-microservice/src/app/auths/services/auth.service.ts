import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';
import {
  RefreshTokenRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';

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
  ): Promise<LoginResponseDto> {
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
  ): Promise<RefreshTokenResponseDto> {
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

    // Rotation: each refresh token can be used once.
    await this.refreshRepo.deleteByToken(tokenHash);

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

  private async issueTokens(claims: TokenClaims): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
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
      refresh_token,
      expires_in: Math.max(
        0,
        this.expiryOf(access_token) - Math.floor(Date.now() / 1000)
      ),
    };
  }

  /** Expiry of a freshly signed token, in seconds since the epoch. */
  private expiryOf(token: string): number {
    const { exp } = this.jwtService.decode<{ exp: number }>(token);
    return exp;
  }
}
