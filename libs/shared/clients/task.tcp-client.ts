import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTcpClient } from './base-tcp-client';

@Injectable()
export class TaskTcpClient extends BaseTcpClient {
  constructor(config: ConfigService) {
    super(config, {
      hostKey: 'TASK_MS_HOST',
      portKey: 'TASK_MS_PORT',
      host: 'task-microservice',
      port: 4002,
    });
  }
}
