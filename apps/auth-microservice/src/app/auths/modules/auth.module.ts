import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken, RevokedToken } from '../entities';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { EnvironmentService } from '../../common/config/env.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, RevokedToken]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, RevokedTokenRepository, EnvironmentService],
})
export class AuthModule {}
