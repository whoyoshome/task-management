import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth.module';

@Module({
  imports: [AuthModule],
})
export class AuthsModule {}
