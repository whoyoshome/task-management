import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Observable, timeout } from 'rxjs';

const DEFAULT_RPC_TIMEOUT_MS = 5000;

/** The subset of ClientProxy used by callers; every request has a timeout. */
export interface RpcClient {
  send<TResult = any, TInput = any>(
    pattern: unknown,
    data: TInput
  ): Observable<TResult>;
}

export abstract class BaseTcpClient implements OnModuleDestroy {
  private readonly client: ClientProxy;
  private readonly timeoutMs: number;

  protected constructor(
    config: ConfigService,
    service: { hostKey: string; portKey: string; host: string; port: number }
  ) {
    const host = config.get<string>(service.hostKey) ?? service.host;
    const port = Number(config.get<string>(service.portKey) ?? service.port);
    this.timeoutMs = Number(
      config.get<string>('RPC_TIMEOUT_MS') ?? DEFAULT_RPC_TIMEOUT_MS
    );

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  }

  /**
   * Requests fail with rxjs TimeoutError instead of hanging forever when the
   * microservice is down or slow; the gateway maps it to 504.
   */
  getClient(): RpcClient {
    return {
      send: (pattern, data) =>
        this.client.send(pattern, data).pipe(timeout(this.timeoutMs)),
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
