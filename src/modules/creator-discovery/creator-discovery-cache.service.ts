import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@modules/cache/redis-cache.service';

@Injectable()
export class CreatorDiscoveryCacheService {
  private readonly ttlHours = 1;
  private readonly prefix = 'sme:creator:discovery';

  constructor(private readonly cache: RedisCacheService) {}

  async get(key: string) {
    return this.cache.get<Record<string, unknown>>(`${this.prefix}:${key}`);
  }

  async set(key: string, value: unknown) {
    await this.cache.set(`${this.prefix}:${key}`, value, this.ttlHours);
  }

  async getProfile(key: string) {
    return this.cache.get<Record<string, unknown>>(
      `${this.prefix}:profile:${key}`,
    );
  }

  async setProfile(key: string, value: unknown) {
    await this.cache.set(`${this.prefix}:profile:${key}`, value, this.ttlHours);
  }
}
