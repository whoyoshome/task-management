import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentService } from './app/common/config/env.service';
import { REFRESH_COOKIE } from './app/auth/refresh-cookie';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

export const setupSwagger = async (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const envService = app.get(EnvironmentService);
  const swaggerConfig = configService.get('swagger');
  const port = envService.getPort();
  const defaultServer = `http://localhost:${port}/api`;
  const envServer = configService.get<string>('FRONTEND_API_URL');

  let builder = new DocumentBuilder()
    .setTitle(swaggerConfig.docTitle)
    .setDescription(swaggerConfig.docDescription)
    .setVersion(swaggerConfig.docVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token'
    )
    .addCookieAuth(REFRESH_COOKIE);

  const servers = [defaultServer];
  if (envServer) {
    servers.unshift(envServer);
  }
  servers.forEach((url) => (builder = builder.addServer(url)));

  const config = builder.build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: swaggerConfig.siteTitle,
  };

  SwaggerModule.setup('api/docs', app, document, customOptions);
};
