import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserTcpClient } from '@shared/clients';

@Module({
  controllers: [UserController],
  providers: [UserService, UserTcpClient],
})
export class UserModule {}
