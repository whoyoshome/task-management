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
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should only list the projects a regular user belongs to', async () => {
      const run = Date.now().toString().slice(-8);
      const email = `visibility-${run}@example.com`;
      const created = await helpers.createTestUser(authToken, {
        email,
        password: 'Password123!',
        full_name: 'Visibility Check',
      });
      const memberId = created.body.id;
      const member = await helpers.login(email, 'Password123!');

      const shared = await helpers.createTestProject(authToken, {
        name: 'Shared project',
        key: `SHR-${run}`,
        description: 'Has the new user as member',
        created_by: userId,
        members: [{ user_id: memberId, role: 'member' }],
      });
      const hidden = await helpers.createTestProject(authToken, {
        name: 'Hidden project',
        key: `HID-${run}`,
        description: 'The new user is not a member',
        created_by: userId,
      });

      const memberView = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${member.token}`)
        .expect(200);
      const memberIds = memberView.body.map((p: { id: string }) => p.id);
      expect(memberIds).toEqual([shared.body.id]);

      const adminView = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const adminIds = adminView.body.map((p: { id: string }) => p.id);
      expect(adminIds).toEqual(
        expect.arrayContaining([shared.body.id, hidden.body.id])
      );
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
        .expect(200);

      expect(response.body.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for a malformed project id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
