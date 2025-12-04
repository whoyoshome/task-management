import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getPort(): number {
    return Number(this.configService.get('PORT'));
  }

  getApiKeyMiddleware(): string {
    return this.configService.get<string>('API_KEY_MIDDLEWARE');
  }

  getSiteTitle(): string | undefined {
    return this.configService.get<string>('SITE_TITLE');
  }

  getDocTitle(): string | undefined {
    return this.configService.get<string>('DOC_TITLE');
  }

  getDocDescription(): string | undefined {
    return this.configService.get<string>('DOC_DESCRIPTION');
  }

  getDocVersion(): string | undefined {
    return this.configService.get<string>('DOC_VERSION');
  }

  getJwtSecret(): string | undefined {
    return this.configService.get<string>('JWT_SECRET');
  }

  getJwtExpiresIn(): string | undefined {
    return this.configService.get<string>('JWT_EXPIRES_IN');
  }

  getJwtRefreshSecret(): string | undefined {
    return this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  getJwtRefreshExpiresIn(): string | undefined {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
  }
}
