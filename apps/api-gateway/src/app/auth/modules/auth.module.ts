import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthTcpClient, UserTcpClient } from '@shared/clients';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTcpClient, UserTcpClient],
})
export class AuthModule {}
