import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private config: ConfigService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const userHost = this.config.get<string>('USER_MS_HOST', 'user-microservice');
    const userPort = Number(this.config.get<string>('USER_MS_PORT', '4001'));
    const taskHost = this.config.get<string>('TASK_MS_HOST', 'task-microservice');
    const taskPort = Number(this.config.get<string>('TASK_MS_PORT', '4002'));
    const authHost = this.config.get<string>('AUTH_MS_HOST', 'auth-microservice');
    const authPort = Number(this.config.get<string>('AUTH_MS_PORT', '4003'));

    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.microservice.pingCheck('user_microservice', {
          transport: Transport.TCP,
          options: { host: userHost, port: userPort },
        }),
      () =>
        this.microservice.pingCheck('task_microservice', {
          transport: Transport.TCP,
          options: { host: taskHost, port: taskPort },
        }),
      () =>
        this.microservice.pingCheck('auth_microservice', {
          transport: Transport.TCP,
          options: { host: authHost, port: authPort },
        }),
    ]);
  }
}
