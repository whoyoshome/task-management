import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';

describe('Projects E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    app = (global as any).app;
    helpers = new TestHelpers(app);

    const loginResult = await helpers.login();
    authToken = loginResult.token;
    userId = loginResult.userId;
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'E2E Test Project',
        key: 'E2E-001',
        description: 'Project created in E2E test',
        created_by: userId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .send(projectData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(projectData.name);
      expect(response.body.key).toBe(projectData.key);

      projectId = response.body.id;
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .send({
          name: '',
          key: 'TEST',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should get all projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project by id', async () => {
      if (!projectId) {
        const createResponse = await helpers.createTestProject(authToken, {
          name: 'Test Project',
          key: 'TEST-001',
          description: 'Test',
          created_by: userId,
        });
        projectId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .expect(200);

      expect(response.body.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .expect(404);
    });
  });
});
