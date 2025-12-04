import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthTcpClient {
  private client: ClientProxy;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('AUTH_MS_HOST') ?? 'auth-microservice';
    const port = Number(this.config.get<string>('AUTH_MS_PORT') ?? 4003);

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  }

  getClient(): ClientProxy {
    return this.client;
  }
}
