import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { RefreshCookie } from '../refresh-cookie';
import { IssuedTokens, LoginRequestDto } from '@shared/contracts';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const issued: IssuedTokens = {
    access_token: 'access-token',
    expires_in: 3600,
    refresh_token: 'refresh-token',
    refresh_expires_in: 604800,
  };

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/v1/auth',
  };

  const mockService = {
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  const response = () =>
    ({ cookie: jest.fn(), clearCookie: jest.fn() } as unknown as jest.Mocked<
      Pick<Response, 'cookie' | 'clearCookie'>
    > &
      Response);

  const requestWith = (cookies: Record<string, string>) =>
    ({ cookies } as unknown as Request);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        RefreshCookie,
        { provide: AuthService, useValue: mockService },
        { provide: ConfigService, useValue: { get: () => true } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns the access token and puts the refresh token in a cookie', async () => {
      const loginDto: LoginRequestDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      service.login.mockResolvedValue(issued);
      const res = response();

      const result = await controller.login(loginDto, res);

      expect(result).toEqual({ access_token: 'access-token', expires_in: 3600 });
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
        ...cookieOptions,
        maxAge: 604800 * 1000,
      });
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('refreshes with the cookie and rotates it', async () => {
      service.refreshAccessToken.mockResolvedValue({
        ...issued,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      const res = response();

      const result = await controller.refresh(
        requestWith({ refresh_token: 'refresh-token' }),
        res
      );

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_in: 3600,
      });
      expect(service.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('rejects a request without the cookie', async () => {
      await expect(
        controller.refresh(requestWith({}), response())
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(service.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('clears the cookie when the token is rejected', async () => {
      const rejected = { statusCode: 401, message: 'Invalid refresh token' };
      service.refreshAccessToken.mockRejectedValue(rejected);
      const res = response();

      await expect(
        controller.refresh(requestWith({ refresh_token: 'stale' }), res)
      ).rejects.toBe(rejected);
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', cookieOptions);
    });

    it('keeps the cookie when the auth service is unavailable', async () => {
      const unavailable = { statusCode: 503, message: 'Service unavailable' };
      service.refreshAccessToken.mockRejectedValue(unavailable);
      const res = response();

      await expect(
        controller.refresh(requestWith({ refresh_token: 'valid' }), res)
      ).rejects.toBe(unavailable);
      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the token from the cookie and clears it', async () => {
      service.logout.mockResolvedValue(undefined);
      const res = response();

      await controller.logout(requestWith({ refresh_token: 'refresh-token' }), res);

      expect(service.logout).toHaveBeenCalledWith('refresh-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', cookieOptions);
    });

    it('succeeds without a cookie', async () => {
      const res = response();

      await controller.logout(requestWith({}), res);

      expect(service.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });
});
