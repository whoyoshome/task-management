import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserTcpClient {
  private client: ClientProxy;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('USER_MS_HOST') ?? 'user-microservice';
    const port = Number(this.config.get<string>('USER_MS_PORT') ?? 4001);

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  }

  getClient(): ClientProxy {
    return this.client;
  }
}
