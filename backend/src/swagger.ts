import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Configure and setup Swagger/OpenAPI documentation
 * @param app - NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
  const appName = process.env.APP_NAME?.trim() || 'CIAP Backend';
  const appDescription =
    process.env.APP_DESCRIPTION?.trim() ||
    'NestJS API with Drizzle ORM and PostgreSQL';
  const appVersion = process.env.APP_VERSION?.trim() || '1.0.0';
  const supportName = process.env.APP_SUPPORT_NAME?.trim() || 'CIAP API Team';
  const supportUrl = process.env.APP_SUPPORT_URL?.trim() || '';
  const supportEmail = process.env.APP_SUPPORT_EMAIL?.trim() || '';
  const licenseName = process.env.APP_LICENSE_NAME?.trim() || 'UNLICENSED';
  const licenseUrl = process.env.APP_LICENSE_URL?.trim() || '';

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(appDescription)
    .setVersion(appVersion)
    .setContact(supportName, supportUrl, supportEmail)
    .setLicense(licenseName, licenseUrl)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('app', 'Application endpoints')
    .addTag('auth', 'Core authentication endpoints')
    .addTag('auth-socials', 'OAuth/social provider endpoints')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
    customCss: '.topbar { display: none }',
  });
}
