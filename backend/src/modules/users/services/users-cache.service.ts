import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@modules/cache/redis-cache.service';

@Injectable()
export class UsersCacheService {
  private readonly ttlHours = 0.25;
  private readonly prefix = 'users:me';

  constructor(private readonly cache: RedisCacheService) {}

  async getMe(userId: number) {
    return this.cache.get<Record<string, unknown>>(`${this.prefix}:${userId}`);
  }

  async setMe(userId: number, value: unknown) {
    await this.cache.set(`${this.prefix}:${userId}`, value, this.ttlHours);
  }

  async deleteMe(userId: number) {
    await this.cache.delete(`${this.prefix}:${userId}`);
  }
}
