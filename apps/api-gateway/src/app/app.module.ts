import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiKeyMiddleware } from '@libs/utils';
import { UserModule } from './users/modules/user.module';
import {
  TaskModule,
  TaskCommentModule,
  TaskDependenciesModule,
  ProjectModule,
  ProjectMemberModule,
  BoardModule,
} from './tasks/modules';
import { AuthModule } from './auth/modules/auth.module';
import { EnvironmentService } from './common/config/env.service';
import { validationSchema } from './common/config/validation.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import swaggerConfig from './common/config/swagger.config';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { AppLogger } from './common/logging/logger.service';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [swaggerConfig],
      validationSchema,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 120,
        },
      ],
    }),
    UserModule,
    TaskModule,
    TaskCommentModule,
    TaskDependenciesModule,
    ProjectModule,
    ProjectMemberModule,
    BoardModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EnvironmentService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: 'LoggerService',
      useClass: AppLogger,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  constructor(private readonly environmentService: EnvironmentService) {}
  configure(consumer: MiddlewareConsumer) {
    const apiKeyProvider = () => this.environmentService.getApiKeyMiddleware();
    const apiKeyMiddleware = new ApiKeyMiddleware(apiKeyProvider);

    consumer
      .apply(apiKeyMiddleware.use.bind(apiKeyMiddleware))
      .exclude(
        { path: 'api/docs', method: RequestMethod.ALL },
        { path: 'api/docs/', method: RequestMethod.ALL },
        { path: 'api/docs/(.*)', method: RequestMethod.ALL }
      )
      .forRoutes('*');
  }
}
