import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Regression tests for project scoping: a user with a role in project A must
 * not be able to act on project B by pointing a request at A.
 */
describe('Project scope E2E', () => {
  let app: INestApplication;
  let helpers: TestHelpers;
  let adminToken: string;
  let attacker: { token: string; userId: string };
  let victimLabelId: string;
  let projectA: string;
  let projectB: string;

  const run = Date.now().toString().slice(-8);

  const newUser = async (name: string) => {
    const email = `${name}-${run}@example.com`;
    const created = await helpers.createTestUser(adminToken, {
      email,
      password: 'Password123!',
      full_name: name,
    });
    const login = await helpers.login(email, 'Password123!');
    return { id: created.body.id as string, token: login.token };
  };

  beforeAll(async () => {
    app = (global as any).app;
    helpers = new TestHelpers(app);
    const admin = await helpers.login();
    adminToken = admin.token;

    const attackerUser = await newUser('attacker');
    attacker = { token: attackerUser.token, userId: attackerUser.id };
    const victim = await newUser('victim');

    // The attacker administers project A; the victim belongs to project B.
    const a = await helpers.createTestProject(adminToken, {
      name: 'Attacker project',
      key: `SA-${run}`,
      description: 'Attacker is admin here',
      created_by: admin.userId,
      members: [{ user_id: attacker.userId, role: 'admin' }],
    });
    const b = await helpers.createTestProject(adminToken, {
      name: 'Victim project',
      key: `SB-${run}`,
      description: 'Attacker has no role here',
      created_by: admin.userId,
      members: [{ user_id: victim.id, role: 'member' }],
    });
    projectA = a.body.id;
    projectB = b.body.id;

    const label = await request(app.getHttpServer())
      .post('/api/v1/labels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ project_id: projectB, name: `victim-${run}` })
      .expect(201);
    victimLabelId = label.body.id;
  });

  it('rejects acting on another project by claiming your own project_id', async () => {
    // DELETE /labels/:id only needs a member role in the label's project.
    await request(app.getHttpServer())
      .delete(`/api/v1/labels/${victimLabelId}`)
      .query({ project_id: projectA })
      .set('Authorization', `Bearer ${attacker.token}`)
      .expect(403);

    const labels = await request(app.getHttpServer())
      .get(`/api/v1/labels/projects/${projectB}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      labels.body.some((l: { id: string }) => l.id === victimLabelId)
    ).toBe(true);
  });

  it('rejects the same request without project_id (no role in project B)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/labels/${victimLabelId}`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .expect(403);
  });

  it('does not let "assignee_ids[]" turn a non-member search into a full listing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tasks/search')
      .query({ project_id: projectB, 'assignee_ids[]': attacker.userId })
      .set('Authorization', `Bearer ${attacker.token}`)
      .expect(403);
  });

  it('still lets a non-member search their own assigned tasks', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tasks/search')
      .query({ project_id: projectB, assignee_ids: attacker.userId })
      .set('Authorization', `Bearer ${attacker.token}`)
      .expect(200);
  });
});
