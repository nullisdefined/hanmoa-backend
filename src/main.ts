import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { OpenAPIObject } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as path from 'path';
import YAML from 'yamljs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { snapshot: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Hanmoa API')
    .setDescription('Hanmoa Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Public API Spec
  try {
    const swaggerPath = path.join(process.cwd(), 'swagger.yml');
    const swaggerSpec = YAML.load(swaggerPath) as OpenAPIObject;
    SwaggerModule.setup('api-spec', app, swaggerSpec);
  } catch (error) {
    console.warn('Failed to load swagger.yml:', (error as Error).message);
  }

  // Worker API Spec
  try {
    const workerSwaggerPath = path.join(process.cwd(), 'swagger-worker.yml');
    const workerSwaggerSpec = YAML.load(workerSwaggerPath) as OpenAPIObject;
    SwaggerModule.setup('api-spec/worker', app, workerSwaggerSpec);
  } catch (error) {
    console.warn(
      'Failed to load swagger-worker.yml:',
      (error as Error).message,
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api`);
  console.log(
    `Public API Spec is available at: http://localhost:${port}/api-spec`,
  );
  console.log(
    `Worker API Spec is available at: http://localhost:${port}/api-spec/worker`,
  );
}
void bootstrap();
