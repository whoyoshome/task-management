import request, { Response } from 'supertest';
import { INestApplication } from '@nestjs/common';

const ADMIN = { email: 'admin@example.com', password: 'Password123!' };

/** The refresh_token Set-Cookie header of a response, if any. */
function refreshCookieOf(res: Response): string | undefined {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  return cookies.find((c) => c.startsWith('refresh_token='));
}

/** The "name=value" part of a Set-Cookie header, to send it back. */
const cookiePair = (setCookie: string) => setCookie.split(';')[0];

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = (global as any).app;
  });

  const login = () =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send(ADMIN);

  const refresh = (setCookie?: string) => {
    const req = request(app.getHttpServer()).post('/api/v1/auth/refresh');
    return setCookie ? req.set('Cookie', cookiePair(setCookie)) : req;
  };

  describe('POST /api/v1/auth/login', () => {
    it('returns the access token and sets the refresh token as an httpOnly cookie', async () => {
      const response = await login().expect(200);

      expect(typeof response.body.access_token).toBe('string');
      expect(response.body).toHaveProperty('expires_in');
      expect(response.body).not.toHaveProperty('refresh_token');

      const cookie = refreshCookieOf(response);
      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).toMatch(/Path=\/api\/v1\/auth/i);
      expect(cookie).toMatch(/Max-Age=\d+/i);
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'whatever-password',
        })
        .expect(401);
    });

    it('should return 400 with missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: ADMIN.password })
        .expect(400);
    });

    it('should return 400 with missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN.email })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('refreshes with the cookie, rotates it and rejects the old one', async () => {
      const oldCookie = refreshCookieOf(await login().expect(200))!;

      const refreshed = await refresh(oldCookie).expect(200);
      expect(typeof refreshed.body.access_token).toBe('string');
      expect(refreshed.body).not.toHaveProperty('refresh_token');

      const newCookie = refreshCookieOf(refreshed)!;
      expect(cookiePair(newCookie)).not.toBe(cookiePair(oldCookie));

      // The used token is rejected and the response clears the cookie.
      const reused = await refresh(oldCookie).expect(401);
      expect(refreshCookieOf(reused)).toMatch(/^refresh_token=;/);

      await refresh(newCookie).expect(200);
    });

    it('revokes every session of the user when a rotated token is reused', async () => {
      // A user of its own: this revokes all of its sessions, and other specs
      // rely on the seeded users.
      const user = {
        email: `reuse${Date.now()}@example.com`,
        password: 'Password123!',
        full_name: 'Reuse Test',
      };
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(user)
        .expect(201);
      const loginAs = () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: user.email, password: user.password });

      const stolen = refreshCookieOf(await loginAs().expect(200))!;
      const current = refreshCookieOf(await refresh(stolen).expect(200))!;
      const otherDevice = refreshCookieOf(await loginAs().expect(200))!;

      // Past the 10 s grace period that covers concurrent refreshes.
      await new Promise((resolve) => setTimeout(resolve, 12_000));
      await refresh(stolen).expect(401);

      await refresh(current).expect(401);
      await refresh(otherDevice).expect(401);
      await loginAs().expect(200);
    }, 30_000);

    it('should return 401 without the cookie', async () => {
      await refresh().expect(401);
    });

    it('should return 401 with an invalid cookie', async () => {
      await refresh('refresh_token=invalid-token').expect(401);
    });

    it('ignores a refresh token sent in the body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'whatever' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the refresh token and clears the cookie', async () => {
      const cookie = refreshCookieOf(await login().expect(200))!;

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookiePair(cookie))
        .expect(200);
      expect(refreshCookieOf(response)).toMatch(/^refresh_token=;/);

      await refresh(cookie).expect(401);
    });

    it('succeeds without a cookie', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(200);
    });
  });
});
