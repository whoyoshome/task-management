import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';
import { RefreshTokenRequestDto } from '@shared/contracts';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'generate_tokens' })
  async generateTokens(
    @Payload()
    payload: {
      user_id: string;
      email: string;
      role: string;
      full_name: string;
    }
  ) {
    try {
      return await this.authService.generateTokens(
        payload.user_id,
        payload.email,
        payload.role,
        payload.full_name
      );
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }

      console.error('Error in generateTokens:', error);

      if (error.code === '23505') {
        throw new RpcException({
          statusCode: 409,
          message: 'Token already exists. Please try again.',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to generate tokens',
      });
    }
  }

  @MessagePattern({ cmd: 'refresh_token' })
  async refreshAccessToken(@Payload() dto: RefreshTokenRequestDto) {
    try {
      return await this.authService.refreshAccessToken(dto);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('Error in refreshAccessToken:', error);
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to refresh token',
      });
    }
  }

  @MessagePattern({ cmd: 'logout' })
  async logout(@Payload() refreshToken: string): Promise<{ success: boolean }> {
    try {
      await this.authService.logout(refreshToken);
      return { success: true };
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      
      console.error('Error in logout:', error);
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to logout',
      });
    }
  }  
}
