import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getTaskDbHost(): string {
    return this.configService.get<string>('TASK_DB_HOST');
  }

  getTaskDbPort(): string {
    return this.configService.get<string>('TASK_DB_PORT');
  }

  getTaskDbUsername(): string {
    return this.configService.get<string>('TASK_DB_USERNAME');
  }

  getTaskDbPassword(): string {
    return this.configService.get<string>('TASK_DB_PASSWORD');
  }

  getTaskDbName(): string {
    return this.configService.get<string>('TASK_DB_NAME');
  }

  getTaskDbSchema(): string {
    return this.configService.get<string>('TASK_DB_SCHEMA');
  }
}
