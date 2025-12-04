import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskTcpClient {
  private client: ClientProxy;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('TASK_MS_HOST') ?? 'task-microservice';
    const port = Number(this.config.get<string>('TASK_MS_PORT') ?? 4002);

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  }

  getClient(): ClientProxy {
    return this.client;
  }
}
