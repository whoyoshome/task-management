import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { readDatabaseEnv } from '@libs/database';

const root = process.cwd();
// Used by the TypeORM CLI and seeds. Schema changes go through migrations;
// synchronize is only for throwaway local databases (DB_SYNCHRONIZE=true).
const synchronize = process.env.DB_SYNCHRONIZE === 'true';

export default new DataSource({
  type: 'postgres',
  ...readDatabaseEnv('AUTH'),
  entities: [join(root, 'apps/auth-microservice/src/app/**/entities/*{.ts,.js}')],
  migrations: [join(root, 'apps/auth-microservice/src/app/migrations/[0-9]*-*{.ts,.js}')],
  synchronize,
  logging: false,
});
