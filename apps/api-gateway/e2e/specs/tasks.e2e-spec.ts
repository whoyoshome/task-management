import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';
import { TaskStatus } from '@shared/contracts';

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
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
    });
  });

  describe('GET /api/v1/tasks/mine', () => {
    it('should list the caller tasks across projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/mine')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(
        response.body.items.every(
          (task: { assigned_to: string }) => task.assigned_to === userId
        )
      ).toBe(true);
      expect(
        response.body.items.some(
          (task: { project_id: string }) => task.project_id === projectId
        )
      ).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/mine')
        .query({ statuses: TaskStatus.IN_PROGRESS })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(
        response.body.items.every(
          (task: { status: string }) => task.status === TaskStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/tasks/mine').expect(401);
    });
  });

  describe('GET /api/v1/tasks/counts', () => {
    it('should return per-project totals including the test project', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/counts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const counts = response.body.find(
        (row: { project_id: string }) => row.project_id === projectId
      );
      expect(counts).toEqual({
        project_id: projectId,
        total: expect.any(Number),
        assigned_to_me: expect.any(Number),
      });
      expect(counts.total).toBeGreaterThanOrEqual(counts.assigned_to_me);
      expect(counts.assigned_to_me).toBeGreaterThan(0);
    });
  });

  describe('assignment rules', () => {
    it('should reject an assignee who is not a project member', async () => {
      const email = `outsider-${Date.now()}@example.com`;
      const outsider = await helpers.createTestUser(authToken, {
        email,
        password: 'Password123!',
        full_name: 'Outsider',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Not for outsiders',
          description: 'Should be rejected',
          project_id: projectId,
          assigned_to: outsider.body.id,
        })
        .expect(400);

      expect(response.body.message).toBe(
        'The assignee must be a member of the project'
      );

      // Assigning must not have granted access to the project.
      const outsiderLogin = await helpers.login(email, 'Password123!');
      const visible = await request(app.getHttpServer())
        .get('/api/v1/tasks/counts')
        .set('Authorization', `Bearer ${outsiderLogin.token}`)
        .expect(200);
      expect(visible.body).toEqual([]);
    });
  });

  describe('GET /api/v1/tasks/:id/history', () => {
    it('should record each changed field with its author', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'History task',
          description: 'Track my changes',
          project_id: projectId,
          assigned_to: userId,
          priority: 'low',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.IN_PROGRESS, priority: 'high' })
        .expect(200);

      const history = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${created.body.id}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const messages = history.body.map((e: { message: string }) => e.message);
      expect(messages).toEqual(
        expect.arrayContaining([
          'Created the task',
          'Changed status from "pending" to "in-progress"',
          'Changed priority from "low" to "high"',
        ])
      );
      expect(
        history.body.every((e: { actor_id: string }) => e.actor_id === userId)
      ).toBe(true);
    });
  });

  describe('board WIP limits', () => {
    it('should report the task count and flag columns over their limit', async () => {
      const board = await request(app.getHttpServer())
        .get(`/api/v1/boards/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const inProgress = board.body.columns.find(
        (c: { status: string }) => c.status === TaskStatus.IN_PROGRESS
      );
      expect(inProgress.task_count).toBeGreaterThan(0);

      // A limit below the current count is a soft limit: flagged, not blocking.
      await request(app.getHttpServer())
        .patch(`/api/v1/boards/columns/${inProgress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ project_id: projectId })
        .send({ wip_limit: inProgress.task_count - 1 })
        .expect(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/boards/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const flagged = after.body.columns.find(
        (c: { id: string }) => c.id === inProgress.id
      );
      expect(flagged.over_wip_limit).toBe(true);
    });
  });
});
