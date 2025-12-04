import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';

const API_KEY = process.env.API_KEY_MIDDLEWARE || 'test-api-key-e2e';

describe('Auth E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;

  beforeAll(() => {
    app = (global as any).app;
    helpers = new TestHelpers(app);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-api-key', API_KEY)
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
        })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('expires_in');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-api-key', API_KEY)
        .send({
          email: 'nonexistent@example.com',
          password: 'whatever-password',
        })
        .expect(401);
    });

    it('should return 400 with missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-api-key', API_KEY)
        .send({
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should return 400 with missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-api-key', API_KEY)
        .send({
          email: 'admin@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-api-key', API_KEY)
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
        })
        .expect((res) => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Expected 200 or 201, got ${res.status}`);
          }
        });

      const refreshToken = loginResponse.body.refresh_token;

      if (!refreshToken) {
        throw new Error('No refresh token received from login');
      }
      
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('x-api-key', API_KEY)
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(refreshResponse.body).toHaveProperty('expires_in');
    });

    it('should return 401 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('x-api-key', API_KEY)
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });
  });
});
