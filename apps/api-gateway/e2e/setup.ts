import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { AllExceptionsFilter } from '../src/app/common/filters/all-exceptions.filter';
import { AppLogger } from '../src/app/common/logging/logger.service';

process.env.API_KEY_MIDDLEWARE =
  process.env.API_KEY_MIDDLEWARE || 'test-api-key-e2e';

process.env.USER_MS_HOST = process.env.USER_MS_HOST || 'localhost';
process.env.USER_MS_PORT = process.env.USER_MS_PORT || '4001';
process.env.AUTH_MS_HOST = process.env.AUTH_MS_HOST || 'localhost';
process.env.AUTH_MS_PORT = process.env.AUTH_MS_PORT || '4003';
process.env.TASK_MS_HOST = process.env.TASK_MS_HOST || 'localhost';
process.env.TASK_MS_PORT = process.env.TASK_MS_PORT || '4002';

jest.setTimeout(30000);

let app: INestApplication;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  const logger = app.get<AppLogger>('LoggerService');

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix('api');

  await app.init();

  (global as any).app = app;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

export { app };
