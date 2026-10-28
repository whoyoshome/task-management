import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';
import { RefreshTokenRequestDto } from '@shared/contracts';

// Errors are converted to the shared RPC error format by
// AllRpcExceptionsFilter; AuthService throws RpcException with a status code
// for invalid or revoked tokens.
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'generate_tokens' })
  generateTokens(
    @Payload()
    payload: {
      user_id: string;
      email: string;
      role: string;
      full_name: string;
    }
  ) {
    return this.authService.generateTokens(
      payload.user_id,
      payload.email,
      payload.role,
      payload.full_name
    );
  }

  @MessagePattern({ cmd: 'refresh_token' })
  refreshAccessToken(@Payload() dto: RefreshTokenRequestDto) {
    return this.authService.refreshAccessToken(dto);
  }

  @MessagePattern({ cmd: 'logout' })
  async logout(@Payload() refreshToken: string): Promise<{ success: boolean }> {
    await this.authService.logout(refreshToken);
    return { success: true };
  }
}
