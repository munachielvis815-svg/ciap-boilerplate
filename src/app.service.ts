import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  /**
   * API information endpoint.
   * Health status is intentionally served by HealthModule routes under /health.
   */
  getInfo() {
    return {
      name: 'CIAP',
      version: '0.0.1',
      description: 'NestJS API with Drizzle ORM and PostgreSQL',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'RESTful API',
        'Swagger/OpenAPI Documentation',
        'PostgreSQL Database',
        'Drizzle ORM',
        'JWT Authentication (ready)',
      ],
    };
  }
}
