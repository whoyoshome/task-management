import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../common/config/configuration.module';
import { EnvironmentService } from '../common/config/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [EnvironmentService],
      useFactory: async (env: EnvironmentService) => {
        const isDevelopment = process.env.NODE_ENV !== 'prod';

        return {
          type: 'postgres',
          host: env.getAuthDbHost(),
          port: Number(env.getAuthDbPort()),
          username: env.getAuthDbUsername(),
          password: env.getAuthDbPassword(),
          database: env.getAuthDbName(),
          schema: env.getAuthDbSchema(),
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          synchronize: isDevelopment,
          migrationsRun: isDevelopment,
          logging: false,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
