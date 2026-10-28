import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

const host = process.env.AUTH_DB_HOST ?? 'localhost';
const port = Number(process.env.AUTH_DB_PORT ?? 5432);
const username = process.env.AUTH_DB_USERNAME ?? 'admin';
const password = process.env.AUTH_DB_PASSWORD ?? '654321';
const database = process.env.AUTH_DB_NAME ?? 'task-management';
const schema = process.env.AUTH_DB_SCHEMA ?? 'auths';

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
  entities: [join(root, 'apps/auth-microservice/src/app/**/entities/*{.ts,.js}')],
  migrations: [join(root, 'apps/auth-microservice/src/app/migrations/[0-9]*-*{.ts,.js}')],
  synchronize,
  logging: false,
});
