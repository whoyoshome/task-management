import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import type { QueryRunner } from 'typeorm';

/** Each microservice reads its database settings from <PREFIX>_DB_*. */
export type DatabasePrefix = 'USER' | 'TASK' | 'AUTH';

const SETTINGS = ['HOST', 'PORT', 'USERNAME', 'PASSWORD', 'NAME', 'SCHEMA'] as const;

/**
 * <PREFIX>_DB_* settings for code that runs outside Nest: the TypeORM CLI
 * data sources and the seeds. Variables already set win over .env, which
 * is loaded when present. There are no fallbacks, so a missing setting fails
 * loudly instead of silently using a default password.
 */
export function readDatabaseEnv(prefix: DatabasePrefix) {
  loadDotEnv();
  const name = (setting: (typeof SETTINGS)[number]) => `${prefix}_DB_${setting}`;
  const missing = SETTINGS.map(name).filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing database settings: ${missing.join(', ')}. ` +
        'Set them in the environment or in .env.'
    );
  }

  const value = (setting: (typeof SETTINGS)[number]) =>
    process.env[name(setting)] as string;
  return {
    host: value('HOST'),
    port: Number(value('PORT')),
    username: value('USERNAME'),
    password: value('PASSWORD'),
    database: value('NAME'),
    schema: value('SCHEMA'),
    ssl: databaseSsl(),
  };
}

/**
 * TLS for the database connection, from DB_SSL: "true" encrypts and
 * verifies the server certificate (managed Postgres such as Neon),
 * "no-verify" encrypts without verifying it (self-signed certificates),
 * anything else connects without TLS (local Docker, CI).
 */
export function databaseSsl(): false | { rejectUnauthorized: boolean } {
  const mode = process.env.DB_SSL;
  if (mode === 'true') return { rejectUnauthorized: true };
  if (mode === 'no-verify') return { rejectUnauthorized: false };
  return false;
}

function loadDotEnv(): void {
  try {
    process.loadEnvFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

/**
 * The quoted schema of the data source running a migration, so migrations
 * follow <PREFIX>_DB_SCHEMA. migration:generate writes the schema name
 * literally: replace it with this.
 */
export function schemaOf(queryRunner: QueryRunner): string {
  const { schema } = queryRunner.connection.options as { schema?: string };
  if (!schema) {
    throw new Error('The data source running the migration has no schema');
  }
  return `"${schema}"`;
}

/** Joi rules for a microservice's <PREFIX>_DB_* variables. */
export function databaseEnvSchema(prefix: DatabasePrefix): Joi.PartialSchemaMap {
  return Object.fromEntries(
    SETTINGS.map((setting) => [
      `${prefix}_DB_${setting}`,
      setting === 'PORT' ? Joi.number().required() : Joi.string().required(),
    ])
  );
}

/**
 * Postgres connection for a microservice. Migrations own the schema and run
 * on startup; DB_SYNCHRONIZE=true is only for throwaway local databases
 * created by synchronize. Migrations are passed explicitly so webpack
 * bundles them.
 */
export function postgresModule(
  prefix: DatabasePrefix,
  migrations: Array<new () => unknown>
): DynamicModule {
  return TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const setting = (name: (typeof SETTINGS)[number]) =>
        config.getOrThrow<string>(`${prefix}_DB_${name}`);
      const synchronize = process.env.DB_SYNCHRONIZE === 'true';

      return {
        type: 'postgres',
        host: setting('HOST'),
        port: Number(setting('PORT')),
        username: setting('USERNAME'),
        password: setting('PASSWORD'),
        database: setting('NAME'),
        schema: setting('SCHEMA'),
        ssl: databaseSsl(),
        migrations,
        synchronize,
        migrationsRun: !synchronize,
        logging: false,
        autoLoadEntities: true,
      };
    },
  });
}
