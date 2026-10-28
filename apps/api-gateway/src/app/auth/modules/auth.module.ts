import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { RefreshCookie } from '../refresh-cookie';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RefreshCookie],
})
export class AuthModule {}
