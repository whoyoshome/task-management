import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AllRpcExceptionsFilter } from '@libs/utils';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // AppModule's ConfigModule.forRoot has already loaded .env at import time.
  const port = Number(process.env.TASK_MS_PORT ?? 4002);

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      // 0.0.0.0 for Docker networks; the single-container demo binds to
      // 127.0.0.1 so the unauthenticated TCP port is never exposed.
      host: process.env.MS_BIND_HOST ?? '0.0.0.0',
      port,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllRpcExceptionsFilter());

  await app.listen();
  Logger.log(`✅ Task microservice is running via TCP on port ${port}`);
}

bootstrap();
