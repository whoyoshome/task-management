import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AllRpcExceptionsFilter } from '@libs/utils';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // AppModule's ConfigModule.forRoot has already loaded .env at import time.
  const port = Number(process.env.USER_MS_PORT ?? 4001);

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllRpcExceptionsFilter());

  await app.listen();
  Logger.log(`✅ User microservice is running via TCP on port ${port}`);
}

bootstrap();
