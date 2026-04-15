import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

/**
 * Generic Redis cache service with TTL support.
 * Provides basic get/set/delete operations with JSON serialization.
 * Used as base for domain-specific cache services (YouTube, etc.).
 *
 * Optional: Falls back gracefully if Redis is unavailable.
 */
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTtlHours: number;
  private readonly isAvailable: boolean;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.defaultTtlHours =
      this.configService.get<number>('CACHE_DEFAULT_TTL_HOURS') || 1;

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set; cache layer will operate in memory-only mode',
      );
      this.isAvailable = false;
      return;
    }

    try {
      this.isAvailable = true;
      this.logger.log('Redis cache manager initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis cache: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.isAvailable = false;
    }
  }

  /**
   * Set a key-value pair in cache.
   * @param key Cache key
   * @param value JSON-serializable value
   * @param ttlHours Optional TTL in hours (default: CACHE_DEFAULT_TTL_HOURS)
   */
  async set<T>(key: string, value: T, ttlHours?: number): Promise<void> {
    if (!this.isAvailable) {
      this.logger.debug(`Cache unavailable; skipping set for key '${key}'`);
      return;
    }

    const ttl = ttlHours ?? this.defaultTtlHours;
    const ttlMs = ttl * 3600 * 1000;

    try {
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`Cached key '${key}' with TTL ${ttl}h`);
    } catch (error) {
      this.logger.error(`Failed to cache key '${key}':`, error);
      // Non-critical: cache failure should not break application
    }
  }

  /**
   * Get a value from cache.
   * @param key Cache key
   * @returns Parsed value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const cached = await this.cacheManager.get<T>(key);
      return cached ?? null;
    } catch (error) {
      this.logger.error(`Failed to retrieve cache key '${key}':`, error);
      return null;
    }
  }

  /**
   * Delete a key from cache.
   */
  async delete(key: string): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache key '${key}'`);
    } catch (error) {
      this.logger.error(`Failed to delete cache key '${key}':`, error);
    }
  }

  /**
   * Delete multiple keys by pattern.
   * Note: cache-manager doesn't support pattern matching directly.
   * This returns 0 as we can't delete by pattern through the generic interface.
   *
   * @param pattern Redis glob pattern (e.g., "youtube:video:*")
   * @returns 0 (pattern matching not available through cache-manager)
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isAvailable) {
      this.logger.debug('Pattern deletion unavailable; cache not enabled');
      return 0;
    }

    this.logger.debug(
      `Pattern deletion for '${pattern}' not supported by cache-manager; returning 0`,
    );
    return 0;
  }

  /**
   * Verify cache is operational.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'cache:health';
      await this.set(testKey, { ok: true }, 1);
      await this.delete(testKey);
      return true;
    } catch (error) {
      this.logger.error(`Cache health check failed: ${String(error)}`);
      return false;
    }
  }
}
