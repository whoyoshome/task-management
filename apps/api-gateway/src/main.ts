import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { setupSwagger } from './swagger';
import { EnvironmentService } from './app/common/config/env.service';
import { AllExceptionsFilter } from './app/common/filters/all-exceptions.filter';
import { AppLogger } from './app/common/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envService = app.get(EnvironmentService);
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';

  const logger = app.get<AppLogger>('LoggerService');

  app.use(helmet());
  // Reads the refresh token cookie (see RefreshCookie).
  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const corsEnv = configService.get<string>('FRONTEND_API_URL');
  const allowedList = (corsEnv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const wildcardToRegex = (pattern: string) =>
    new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

  const regexList = allowedList
    .filter((o) => o.includes('*'))
    .map((p) => wildcardToRegex(p));

  if (allowedList.length === 0) {
    Logger.warn(
      'FRONTEND_API_URL is empty: cross-origin browser requests will be rejected'
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, server-to-server) are not
      // subject to CORS.
      if (!origin) return callback(null, true);
      if (allowedList.includes(origin)) return callback(null, true);
      if (regexList.some((re) => re.test(origin))) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  });

  // Behind a reverse proxy, set TRUST_PROXY (e.g. "1" for one hop) so req.ip,
  // and therefore rate limiting, uses the real client address.
  const trustProxy = configService.get<string>('TRUST_PROXY');
  if (trustProxy) {
    const hops = Number(trustProxy);
    app
      .getHttpAdapter()
      .getInstance()
      .set('trust proxy', Number.isNaN(hops) ? trustProxy : hops);
  }

  setupSwagger(app);

  const port = envService.getPort();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}
bootstrap();
