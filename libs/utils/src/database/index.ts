import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

/** Each microservice reads its database settings from <PREFIX>_DB_*. */
export type DatabasePrefix = 'USER' | 'TASK' | 'AUTH';

const SETTINGS = ['HOST', 'PORT', 'USERNAME', 'PASSWORD', 'NAME', 'SCHEMA'] as const;

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
        migrations,
        synchronize,
        migrationsRun: !synchronize,
        logging: false,
        autoLoadEntities: true,
      };
    },
  });
}
