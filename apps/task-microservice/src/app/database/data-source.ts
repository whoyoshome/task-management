import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

const host = process.env.TASK_DB_HOST ?? 'localhost';
const port = Number(process.env.TASK_DB_PORT ?? 5432);
const username = process.env.TASK_DB_USERNAME ?? 'admin';
const password = process.env.TASK_DB_PASSWORD ?? '654321';
const database = process.env.TASK_DB_NAME ?? 'task-management';
const schema = process.env.TASK_DB_SCHEMA ?? 'tasks';

const root = process.cwd();
const isDevelopment = process.env.NODE_ENV !== 'prod';

export default new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  schema,
  entities: [join(root, 'apps/task-microservice/src/app/tasks/entities/*{.ts,.js}')],
  migrations: [join(root, 'apps/task-microservice/src/app/migrations/*{.ts,.js}')],
  synchronize: isDevelopment,
  migrationsRun: isDevelopment,
  logging: false,
});
