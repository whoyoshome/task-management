import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const API_KEY = process.env.API_KEY_MIDDLEWARE || 'test-api-key-e2e';

export class TestHelpers {
  constructor(private app: INestApplication) {}

  /**
   * Login and get JWT token
   */
  async login(
    email: string = 'admin@example.com',
    password: string = 'Password123!'
  ): Promise<{ token: string; userId: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-api-key', API_KEY)
      .send({ email, password })
      .expect((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(`Expected 200 or 201, got ${res.status}`);
        }
      });

    const token = response.body.access_token;

    let userId: string;

    try {
      const decoded = jwt.decode(token) as any;
      userId = decoded?.sub || decoded?.userId;
      if (!userId) {
        throw new Error('No userId found in token');
      }
    } catch (error) {
      throw new Error(`Failed to decode token: ${error}`);
    }

    return {
      token,
      userId,
    };
  }

  /**
   * Create a test user
   */
  async createTestUser(
    token: string,
    userData: {
      email: string;
      password: string;
      full_name: string;
      role?: string;
    }
  ) {
    return request(this.app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', API_KEY)
      .send(userData);
  }

  /**
   * Create a test project
   */
  async createTestProject(
    token: string,
    projectData: {
      name: string;
      key: string;
      description: string;
      created_by: string;
    }
  ) {
    return request(this.app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', API_KEY)
      .send(projectData);
  }

  /**
   * Create a test task
   */
  async createTestTask(
    token: string,
    taskData: {
      title: string;
      description: string;
      project_id: string;
      created_by: string;
      assigned_to: string;
    }
  ) {
    return request(this.app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', API_KEY)
      .send(taskData);
  }

  /**
   * Headers authenticated
   */
  getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'x-api-key': process.env.API_KEY_MIDDLEWARE || 'test-api-key',
    };
  }
}
