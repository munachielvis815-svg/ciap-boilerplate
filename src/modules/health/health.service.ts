import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  ApiHealthDto,
  DatabaseHealthDto,
  ReadinessHealthDto,
  CacheHealthDto,
} from './dto/health.dto';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import { RedisCacheService } from '@modules/cache/redis-cache.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DATABASE_PROVIDER) private db: Database,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Check overall API health
   */
  check(): ApiHealthDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  /**
   * Check database connection using Drizzle ORM
   */
  async checkDatabase(): Promise<DatabaseHealthDto> {
    try {
      // Use SQL raw query to test connection
      const result = await this.db.execute(sql`SELECT NOW()`);

      if (result) {
        this.logger.log('Database connection verified');
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Database connection successful',
          database: 'connected',
        };
      }

      // If result is falsy, still return error
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database returned empty result',
        database: 'disconnected',
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Redis/cache connection health
   */
  async checkCache(): Promise<CacheHealthDto> {
    try {
      const isHealthy = await this.cache.healthCheck();

      if (isHealthy) {
        this.logger.log('Redis cache health verified');
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Redis cache connection successful',
          cache: 'connected',
        };
      }

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Redis cache health check failed',
        cache: 'disconnected',
      };
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Redis cache connection failed',
        cache: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check service readiness (all dependencies ready)
   */
  async readiness(): Promise<ReadinessHealthDto> {
    const dbHealth = await this.checkDatabase();
    const cacheHealth = await this.checkCache();
    const isReady = dbHealth.status === 'ok' && cacheHealth.status === 'ok';

    return {
      status: isReady ? 'ok' : 'unavailable',
      timestamp: new Date().toISOString(),
      message: isReady ? 'Service is ready' : 'Service is not ready',
      ready: isReady,
    };
  }
}
