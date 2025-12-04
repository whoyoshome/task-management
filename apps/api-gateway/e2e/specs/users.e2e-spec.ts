import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';

const API_KEY = process.env.API_KEY_MIDDLEWARE || 'test-api-key-e2e';

describe('Users E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;
  let authToken: string;
  let adminToken: string;
  let userId: string;
  let adminUserId: string;
  let createdUserId: string;

  beforeAll(async () => {
    app = (global as any).app;
    helpers = new TestHelpers(app);

    const loginResult = await helpers.login(
      'member@example.com',
      'Password123!'
    );
    authToken = loginResult.token;
    userId = loginResult.userId;

    const adminLoginResult = await helpers.login(
      'admin@example.com',
      'Password123!'
    );
    adminToken = adminLoginResult.token;
    adminUserId = adminLoginResult.userId;
  });

  describe('POST /api/v1/users', () => {
    it('should create a user successfully', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `testuser${timestamp}@example.com`,
        password: 'TestPassword123!',
        full_name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('x-api-key', API_KEY)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.full_name).toBe(userData.full_name);
      expect(response.body).not.toHaveProperty('password');

      createdUserId = response.body.id;
    });

    it('should return 400 with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('x-api-key', API_KEY)
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          full_name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 with missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('x-api-key', API_KEY)
        .send({
          email: 'test@example.com',
          full_name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 with missing full_name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('x-api-key', API_KEY)
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', API_KEY)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('full_name');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('x-api-key', API_KEY)
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .set('x-api-key', API_KEY)
        .expect(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', API_KEY)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('x-api-key', API_KEY)
        .expect(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by id successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', API_KEY)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('full_name');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 with invalid user id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', API_KEY)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('x-api-key', API_KEY)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user successfully as admin', async () => {
      const updateData = {
        full_name: 'Updated Name',
        password: 'NewPassword123!',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-api-key', API_KEY)
        .send(updateData)
        .expect(200);

      expect(response.body.full_name).toBe(updateData.full_name);
      expect(response.body.id).toBe(userId);
    });

    it('should return 403 when non-admin tries to update', async () => {
      const updateData = {
        full_name: 'Updated Name',
        password: 'NewPassword123!',
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', API_KEY)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 with invalid user id', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-api-key', API_KEY)
        .send({
          full_name: 'Updated Name',
          password: 'NewPassword123!',
        })
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('x-api-key', API_KEY)
        .send({
          full_name: 'Updated Name',
          password: 'NewPassword123!',
        })
        .expect(401);
    });
  });
});
