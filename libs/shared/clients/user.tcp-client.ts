import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTcpClient } from './base-tcp-client';

@Injectable()
export class UserTcpClient extends BaseTcpClient {
  constructor(config: ConfigService) {
    super(config, {
      hostKey: 'USER_MS_HOST',
      portKey: 'USER_MS_PORT',
      host: 'user-microservice',
      port: 4001,
    });
  }
}
