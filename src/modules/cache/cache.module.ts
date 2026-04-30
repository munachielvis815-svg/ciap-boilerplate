import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { RedisCacheService } from './redis-cache.service';

/**
 * Cache Module
 * Provides cache-manager integration with optional Redis backend.
 *
 * Design:
 * - RedisCacheService: Wraps cache-manager for generic caching
 * - Falls back to memory cache when Redis unavailable
 *
 * Configuration:
 * - REDIS_URL: Redis connection string (optional, defaults to memory cache)
 * - CACHE_DEFAULT_TTL_HOURS: Default TTL for generic cache (default: 1)
 *
 * Usage:
 * ```typescript
 * constructor(private readonly cache: RedisCacheService) {}
 * await this.cache.set('key', value, 2); // TTL 2 hours
 * const val = await this.cache.get('key'); // typed return
 * ```
 */
@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          return {};
        }
        return {
          stores: new KeyvRedis(redisUrl),
        };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
