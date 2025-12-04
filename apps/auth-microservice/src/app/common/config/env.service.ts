import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getAuthDbHost(): string {
    return this.configService.get<string>('AUTH_DB_HOST');
  }

  getAuthDbPort(): string {
    return this.configService.get<string>('AUTH_DB_PORT');
  }

  getAuthDbUsername(): string {
    return this.configService.get<string>('AUTH_DB_USERNAME');
  }

  getAuthDbPassword(): string {
    return this.configService.get<string>('AUTH_DB_PASSWORD');
  }

  getAuthDbName(): string {
    return this.configService.get<string>('AUTH_DB_NAME');
  }

  getAuthDbSchema(): string {
    return this.configService.get<string>('AUTH_DB_SCHEMA');
  }

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  getJwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN');
  }

  getJwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  getJwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
  }
}
