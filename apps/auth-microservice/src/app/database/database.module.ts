import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../common/config/configuration.module';
import { EnvironmentService } from '../common/config/env.service';
import { migrations } from '../migrations';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [EnvironmentService],
      useFactory: async (env: EnvironmentService) => {
        // Migrations own the schema and run on startup. DB_SYNCHRONIZE=true is
        // only for throwaway local databases that were created by synchronize.
        const synchronize = process.env.DB_SYNCHRONIZE === 'true';

        return {
          type: 'postgres',
          host: env.getAuthDbHost(),
          port: Number(env.getAuthDbPort()),
          username: env.getAuthDbUsername(),
          password: env.getAuthDbPassword(),
          database: env.getAuthDbName(),
          schema: env.getAuthDbSchema(),
          migrations,
          synchronize,
          migrationsRun: !synchronize,
          logging: false,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
