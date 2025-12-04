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
          host: env.getUserDbHost(),
          port: Number(env.getUserDbPort()),
          username: env.getUserDbUsername(),
          password: env.getUserDbPassword(),
          database: env.getUserDbName(),
          schema: env.getUserDbSchema(),
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
