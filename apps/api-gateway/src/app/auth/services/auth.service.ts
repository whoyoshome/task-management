import { Injectable, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';
import { UserTcpClient, AuthTcpClient } from '@shared/clients';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userClient: UserTcpClient,
    private readonly authClient: AuthTcpClient
  ) {}

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await firstValueFrom(
      this.userClient.getClient().send({ cmd: 'get_user_by_email' }, dto.email)
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return firstValueFrom(
      this.authClient.getClient().send(
        { cmd: 'generate_tokens' },
        {
          user_id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        }
      )
    );
  }

  async refreshAccessToken(
    dto: RefreshTokenRequestDto
  ): Promise<RefreshTokenResponseDto> {
    return firstValueFrom(
      this.authClient.getClient().send({ cmd: 'refresh_token' }, dto)
    );
  }

  async logout(refreshToken: string): Promise<void> {
    return firstValueFrom(
      this.authClient.getClient().send({ cmd: 'logout' }, refreshToken)
    );
  }
}
