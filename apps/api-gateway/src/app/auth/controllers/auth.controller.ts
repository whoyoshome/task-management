import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  AccessTokenResponseDto,
  IssuedTokens,
  LoginRequestDto,
} from '@shared/contracts';
import { AuthService } from '../services/auth.service';
import { REFRESH_COOKIE, RefreshCookie } from '../refresh-cookie';

const statusOf = (error: unknown): number | undefined =>
  (error as { statusCode?: number } | null)?.statusCode;

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshCookie: RefreshCookie
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Stricter than the global limit to slow down password guessing.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @ApiOperation({
    summary: 'Login: returns the access token and sets the refresh cookie',
    operationId: 'loginAuth',
  })
  @ApiResponse({ status: 200, type: AccessTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid login request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AccessTokenResponseDto> {
    return this.respond(res, await this.authService.login(dto));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({
    summary: 'Refresh the access token and rotate the refresh cookie',
    operationId: 'refreshAuth',
  })
  @ApiResponse({ status: 200, type: AccessTokenResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Refresh cookie is missing, revoked or invalid',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AccessTokenResponseDto> {
    const refreshToken = this.refreshCookie.read(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      return this.respond(
        res,
        await this.authService.refreshAccessToken(refreshToken)
      );
    } catch (error) {
      // A rejected token is useless, so drop it; other failures (auth
      // microservice down, timeout) keep the session for a later retry.
      if (statusOf(error) === HttpStatus.UNAUTHORIZED) {
        this.refreshCookie.clear(res);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({
    summary: 'Logout: revoke the refresh token and clear its cookie',
    operationId: 'logoutAuth',
  })
  @ApiResponse({ status: 200 })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    const refreshToken = this.refreshCookie.read(req);
    this.refreshCookie.clear(res);
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
  }

  private respond(res: Response, tokens: IssuedTokens): AccessTokenResponseDto {
    this.refreshCookie.set(res, tokens.refresh_token, tokens.refresh_expires_in);
    return { access_token: tokens.access_token, expires_in: tokens.expires_in };
  }
}
