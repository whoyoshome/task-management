import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getUserDbHost(): string {
    return this.configService.get<string>('USER_DB_HOST');
  }

  getUserDbPort(): string {
    return this.configService.get<string>('USER_DB_PORT');
  }

  getUserDbUsername(): string {
    return this.configService.get<string>('USER_DB_USERNAME');
  }

  getUserDbPassword(): string {
    return this.configService.get<string>('USER_DB_PASSWORD');
  }

  getUserDbName(): string {
    return this.configService.get<string>('USER_DB_NAME');
  }

  getUserDbSchema(): string {
    return this.configService.get<string>('USER_DB_SCHEMA');
  }
}
