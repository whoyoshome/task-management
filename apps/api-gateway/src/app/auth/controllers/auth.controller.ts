import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
} from '@shared/contracts';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Stricter than the global limit to slow down password guessing.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @ApiOperation({ summary: 'Login and obtain tokens', operationId: 'loginAuth' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid login request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', operationId: 'refreshAuth' })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid refresh token request' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is revoked or invalid',
  })
  async refresh(
    @Body() dto: RefreshTokenRequestDto
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshAccessToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token', operationId: 'logoutAuth' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Missing or malformed token' })
  async logout(@Body() dto: RefreshTokenRequestDto): Promise<void> {
    return this.authService.logout(dto.refresh_token);
  }
}
