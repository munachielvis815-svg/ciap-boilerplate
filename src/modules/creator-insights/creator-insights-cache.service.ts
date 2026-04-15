import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@modules/cache/redis-cache.service';

@Injectable()
export class CreatorInsightsCacheService {
  private readonly ttlHours = 1;
  private readonly prefix = 'creator:insights';

  constructor(private readonly cache: RedisCacheService) {}

  async getAudience(userId: number, days: number) {
    return this.cache.get<Record<string, unknown>>(
      `${this.prefix}:audience:${userId}:${days}`,
    );
  }

  async setAudience(userId: number, days: number, value: unknown) {
    await this.cache.set(
      `${this.prefix}:audience:${userId}:${days}`,
      value,
      this.ttlHours,
    );
  }

  async getContent(userId: number, limit: number) {
    return this.cache.get<Record<string, unknown>>(
      `${this.prefix}:content:${userId}:${limit}`,
    );
  }

  async setContent(userId: number, limit: number, value: unknown) {
    await this.cache.set(
      `${this.prefix}:content:${userId}:${limit}`,
      value,
      this.ttlHours,
    );
  }
}
