import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTcpClient } from './base-tcp-client';

@Injectable()
export class AuthTcpClient extends BaseTcpClient {
  constructor(config: ConfigService) {
    super(config, {
      hostKey: 'AUTH_MS_HOST',
      portKey: 'AUTH_MS_PORT',
      host: 'auth-microservice',
      port: 4003,
    });
  }
}
