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
// Used by the TypeORM CLI and seeds. Schema changes go through migrations;
// synchronize is only for throwaway local databases (DB_SYNCHRONIZE=true).
const synchronize = process.env.DB_SYNCHRONIZE === 'true';

export default new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  schema,
  entities: [join(root, 'apps/task-microservice/src/app/tasks/entities/*{.ts,.js}')],
  migrations: [join(root, 'apps/task-microservice/src/app/migrations/[0-9]*-*{.ts,.js}')],
  synchronize,
  logging: false,
});
