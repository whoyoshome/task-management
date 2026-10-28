import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'refresh_token';

/**
 * The refresh token travels in an httpOnly cookie, so page scripts (and an
 * XSS payload) cannot read it. It is scoped to the auth routes, the only
 * ones that need it, and SameSite=Strict keeps other sites from sending it.
 */
@Injectable()
export class RefreshCookie {
  private readonly options: CookieOptions;

  constructor(config: ConfigService) {
    this.options = {
      httpOnly: true,
      // Browsers accept Secure cookies from http://localhost, so this only
      // needs turning off when the API is served over plain http elsewhere.
      secure: String(config.get('REFRESH_COOKIE_SECURE', true)) !== 'false',
      sameSite: 'strict',
      path: '/api/v1/auth',
    };
  }

  read(req: Request): string | undefined {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    return typeof token === 'string' && token ? token : undefined;
  }

  set(res: Response, token: string, maxAgeSeconds: number): void {
    res.cookie(REFRESH_COOKIE, token, {
      ...this.options,
      maxAge: maxAgeSeconds * 1000,
    });
  }

  clear(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, this.options);
  }
}
