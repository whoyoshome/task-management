import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

const host = process.env.USER_DB_HOST ?? 'localhost';
const port = Number(process.env.USER_DB_PORT ?? 5432);
const username = process.env.USER_DB_USERNAME ?? 'admin';
const password = process.env.USER_DB_PASSWORD ?? '654321';
const database = process.env.USER_DB_NAME ?? 'task-management';
const schema = process.env.USER_DB_SCHEMA ?? 'users';

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
  entities: [join(root, 'apps/user-microservice/src/app/**/entities/*{.ts,.js}')],
  migrations: [join(root, 'apps/user-microservice/src/app/migrations/*{.ts,.js}')],
  synchronize: isDevelopment,
  migrationsRun: isDevelopment,
  logging: false,
});
