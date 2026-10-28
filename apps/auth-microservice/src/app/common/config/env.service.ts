import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** JWT settings, validated at startup by validationSchema. */
@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getJwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  getJwtExpiresIn(): string {
    return this.configService.getOrThrow<string>('JWT_EXPIRES_IN');
  }

  getJwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  getJwtRefreshExpiresIn(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
  }
}
