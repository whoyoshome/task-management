import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Sprint and board routes whose DTOs had no validators: the global
 * ValidationPipe (whitelist) stripped every field, so they reached the
 * services empty.
 */
describe('Sprints and boards E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;
  let token: string;
  let userId: string;
  let projectId: string;
  let taskIds: string[];

  const api = () => request(app.getHttpServer());
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = (global as any).app;
    helpers = new TestHelpers(app);
    ({ token, userId } = await helpers.login());

    const run = Date.now().toString().slice(-8);
    const project = await helpers.createTestProject(token, {
      name: 'Sprint project',
      key: `SP-${run}`,
      description: 'Sprints and boards',
      created_by: userId,
    });
    projectId = project.body.id;

    taskIds = [];
    for (const title of ['First', 'Second']) {
      const task = await auth(api().post('/api/v1/tasks')).send({
        title,
        description: 'Sprint task',
        project_id: projectId,
        assigned_to: userId,
      });
      taskIds.push(task.body.id);
    }
  });

  describe('sprint lifecycle', () => {
    let sprintId: string;

    it('creates a sprint with all its fields', async () => {
      const res = await auth(api().post('/api/v1/sprints'))
        .send({
          project_id: projectId,
          name: 'Sprint 1',
          goal: 'Ship it',
          start_date: '2026-11-02',
          end_date: '2026-11-16',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        project_id: projectId,
        name: 'Sprint 1',
        goal: 'Ship it',
        status: 'planned',
      });
      sprintId = res.body.id;
    });

    it('rejects an invalid sprint with 400', async () => {
      await auth(api().post('/api/v1/sprints'))
        .send({ project_id: projectId, name: '', start_date: 'tomorrow' })
        .expect(400);
    });

    it('adds tasks, reorders them and removes one', async () => {
      for (const task_id of taskIds) {
        await auth(api().post(`/api/v1/sprints/${sprintId}/tasks`))
          .send({ task_id })
          .expect(201);
      }

      await auth(api().post(`/api/v1/sprints/${sprintId}/reorder`))
        .send({ task_ids: [...taskIds].reverse() })
        .expect(201);

      await auth(
        api().delete(`/api/v1/sprints/${sprintId}/tasks/${taskIds[1]}`)
      ).expect(200);
    });

    it('starts and closes the sprint', async () => {
      const started = await auth(api().post(`/api/v1/sprints/${sprintId}/start`))
        .send({ end_date: '2026-11-20' })
        .expect(201);
      expect(started.body.status).toBe('active');

      const closed = await auth(
        api().post(`/api/v1/sprints/${sprintId}/close`)
      ).expect(201);
      expect(closed.body.status).toBe('closed');
    });

    it('reorders the backlog', async () => {
      await auth(
        api().post(`/api/v1/sprints/project/${projectId}/backlog/reorder`)
      )
        .send({ task_ids: [taskIds[1]] })
        .expect(201);
    });
  });

  describe('boards', () => {
    let boardId: string;

    it('creates a board with its name', async () => {
      const res = await auth(api().post('/api/v1/boards'))
        .send({ project_id: projectId, name: 'Team board' })
        .expect(201);

      expect(res.body).toMatchObject({ project_id: projectId, name: 'Team board' });
      expect(res.body.columns.length).toBeGreaterThan(0);
      boardId = res.body.id;
    });

    it('moves a task with POST /boards/move', async () => {
      const res = await auth(api().post('/api/v1/boards/move'))
        .send({ task_id: taskIds[1], board_id: boardId, status: 'in-progress' })
        .expect(201);

      expect(res.body.status).toBe('in-progress');
    });

    it('moves a task with POST /tasks/:id/move and validates the status', async () => {
      await auth(api().post(`/api/v1/tasks/${taskIds[1]}/move`))
        .send({ board_id: boardId, status: 'completed' })
        .expect(201);

      await auth(api().post(`/api/v1/tasks/${taskIds[1]}/move`))
        .send({ board_id: boardId, status: 'not-a-status' })
        .expect(400);
    });

    it('lists every label assignment of the project in one request', async () => {
      const label = await auth(api().post('/api/v1/labels'))
        .send({ project_id: projectId, name: 'board-label' })
        .expect(201);
      for (const taskId of taskIds) {
        await auth(
          api().post(`/api/v1/labels/tasks/${taskId}/${label.body.id}`)
        ).expect(201);
      }

      const res = await auth(
        api().get(`/api/v1/labels/projects/${projectId}/assignments`)
      ).expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining(
          taskIds.map((task_id) => ({ task_id, label_id: label.body.id }))
        )
      );
    });
  });

  describe('task search ordering', () => {
    it('sorts by priority rank, not alphabetically', async () => {
      for (const priority of ['low', 'high', 'medium']) {
        await auth(api().post('/api/v1/tasks'))
          .send({
            title: `rank-${priority}`,
            description: 'Priority order',
            project_id: projectId,
            assigned_to: userId,
            priority,
          })
          .expect(201);
      }

      const ranked = async (sort_dir: 'asc' | 'desc') => {
        const res = await auth(api().get('/api/v1/tasks/search'))
          .query({ project_id: projectId, q: 'rank-', sort_by: 'priority', sort_dir })
          .expect(200);
        return res.body.items.map((t: { title: string }) => t.title);
      };

      expect(await ranked('desc')).toEqual(['rank-high', 'rank-medium', 'rank-low']);
      expect(await ranked('asc')).toEqual(['rank-low', 'rank-medium', 'rank-high']);
    });
  });
});
