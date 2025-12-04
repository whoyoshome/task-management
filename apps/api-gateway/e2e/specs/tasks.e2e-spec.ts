import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';
import { TaskStatus } from '../../../../libs/shared/contracts';

describe('Tasks E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    app = (global as any).app;
    helpers = new TestHelpers(app);

    const loginResult = await helpers.login();
    authToken = loginResult.token;
    userId = loginResult.userId;

    if (!userId || userId === 'user-id-from-token') {
      throw new Error('Failed to extract valid userId from token');
    }

    const timestamp = Date.now().toString().slice(-8);
    const uniqueKey = `TEST-${timestamp}`;

    const projectResponse = await helpers.createTestProject(authToken, {
      name: 'Task Test Project',
      key: uniqueKey,
      description: 'Project for task tests',
      created_by: userId,
    });

    if (projectResponse.status !== 201) {
      console.error('Failed to create project:', projectResponse.body);
      throw new Error(`Failed to create project: ${projectResponse.status}`);
    }

    projectId = projectResponse.body.id;
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'E2E Test Task',
        description: 'Task created in E2E test',
        project_id: projectId,
        created_by: userId,
        assigned_to: userId,
        status: 'pending',
        priority: 'medium',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.project_id).toBe(projectId);

      taskId = response.body.id;
    });

    it('should return 400 with invalid project_id', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .send({
          title: 'Test Task',
          project_id: 'invalid-project-id',
          created_by: userId,
          assigned_to: userId,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should get task by id', async () => {
      if (!taskId) {
        const createResponse = await helpers.createTestTask(authToken, {
          title: 'Test Task',
          description: 'Test',
          project_id: projectId,
          created_by: userId,
          assigned_to: userId,
        });
        taskId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .expect(200);

      expect(response.body.id).toBe(taskId);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should update task successfully', async () => {
      if (!taskId) {
        const createResponse = await helpers.createTestTask(authToken, {
          title: 'Test Task',
          description: 'Test',
          project_id: projectId,
          created_by: userId,
          assigned_to: userId,
        });
        taskId = createResponse.body.id;
      }

      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.IN_PROGRESS,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-api-key', process.env.API_KEY_MIDDLEWARE || 'test-api-key')
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
    });
  });
});
