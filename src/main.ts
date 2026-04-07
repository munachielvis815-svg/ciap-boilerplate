import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const logLevel = process.env.LOG_LEVEL || 'debug';
  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  const app = await NestFactory.create(AppModule, {
    logger: [logLevel as any],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
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

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Test API')
    .setDescription('NestJS API with Drizzle ORM and PostgreSQL')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, () => {
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 Swagger docs available at http://localhost:${port}/api`);
    logger.log(`📡 Environment: ${nodeEnv}`);
    logger.log(`📊 Log Level: ${logLevel}`);
  });
}

bootstrap();
