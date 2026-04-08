import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  /**
   * Health check endpoint
   * Returns API health status and uptime
   */
  getHealth() {
    const uptime = process.uptime();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * API information endpoint
   * Returns API metadata and version
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
