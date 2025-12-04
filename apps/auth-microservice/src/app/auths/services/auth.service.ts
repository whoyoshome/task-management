import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';
import {
  RefreshTokenRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';

@Injectable()
export class AuthService {
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
      console.warn('Failed to delete expired tokens:', error);
    }

    try {
      await this.refreshRepo.deleteByUserId(userId);
    } catch (error) {
      console.warn('Failed to delete existing tokens for user:', error);
    }

    const now = Date.now();

    const payload = {
      sub: userId,
      email,
      role,
      full_name,
      iat: Math.floor(now / 1000),
      jti: `${userId}-${now}-${Math.random()}`,
    };

    try {
      const access_token = this.jwtService.sign(payload, {
        secret: this.env.getJwtSecret(),
        expiresIn: this.env.getJwtExpiresIn(),
      });

      let refresh_token = this.jwtService.sign(payload, {
        secret: this.env.getJwtRefreshSecret(),
        expiresIn: this.env.getJwtRefreshExpiresIn(),
      });

      let retries = 3;
      while (retries > 0) {
        try {
          await this.refreshRepo.create({
            user_id: userId,
            token: refresh_token,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          });
          break;
        } catch (error: any) {
          if (error.code === '23505' && retries > 1) {
            await this.refreshRepo.deleteByUserId(userId);
            retries--;
            const newPayload = {
              ...payload,
              jti: `${userId}-${Date.now()}-${Math.random()}`,
            };
            refresh_token = this.jwtService.sign(newPayload, {
              secret: this.env.getJwtRefreshSecret(),
              expiresIn: this.env.getJwtRefreshExpiresIn(),
            });
          } else {
            throw error;
          }
        }
      }

      return {
        access_token,
        refresh_token,
        expires_in: 3600,
      };
    } catch (error: any) {
      console.error('❌ Fatal error in generateTokens:', error);
      throw error;
    }
  }

  async refreshAccessToken(
    dto: RefreshTokenRequestDto
  ): Promise<RefreshTokenResponseDto> {
    const isRevoked = await this.revokedRepo.isRevoked(dto.refresh_token);
    if (isRevoked) {
      throw new RpcException({
        statusCode: 401,
        message: 'Token has been revoked',
      });
    }

    const stored = await this.refreshRepo.findByToken(dto.refresh_token);
    if (!stored) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }

    let payload: any;

    try {
      payload = this.jwtService.verify(dto.refresh_token, {
        secret: this.env.getJwtRefreshSecret(),
      });
    } catch (error) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    }

    const access_token = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        full_name: payload.full_name,
      },
      {
        secret: this.env.getJwtSecret(),
        expiresIn: this.env.getJwtExpiresIn(),
      }
    );

    return {
      access_token,
      expires_in: 3600,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokedRepo.create(refreshToken);
    await this.refreshRepo.deleteByToken(refreshToken);
  }
}
