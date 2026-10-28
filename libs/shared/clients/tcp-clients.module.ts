import { Global, Module } from '@nestjs/common';
import { AuthTcpClient } from './auth.tcp-client';
import { TaskTcpClient } from './task.tcp-client';
import { UserTcpClient } from './user.tcp-client';

/**
 * One connection per microservice for the whole gateway. Feature modules must
 * not list these clients in their own providers, or Nest creates extra
 * instances (and extra TCP connections).
 */
@Global()
@Module({
  providers: [AuthTcpClient, TaskTcpClient, UserTcpClient],
  exports: [AuthTcpClient, TaskTcpClient, UserTcpClient],
})
export class TcpClientsModule {}
