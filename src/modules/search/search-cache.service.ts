import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@modules/cache/redis-cache.service';

@Injectable()
export class SearchCacheService {
  private readonly ttlHours = 0.25;
  private readonly prefix = 'search:creators';

  constructor(private readonly cache: RedisCacheService) {}

  async getCreators(key: string) {
    return this.cache.get<Record<string, unknown>>(`${this.prefix}:${key}`);
  }

  async setCreators(key: string, value: unknown) {
    await this.cache.set(`${this.prefix}:${key}`, value, this.ttlHours);
  }
}
