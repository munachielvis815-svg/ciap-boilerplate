import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import type { CreatorSearchMode } from './search.types';
import { SearchCacheService } from './search-cache.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly cache: SearchCacheService,
  ) {}

  async searchCreators(params: { query: string; limit: number }): Promise<{
    creators: Array<{
      userId: number;
      displayName: string | null;
      bio: string | null;
      influenceScore: number | null;
      audienceSize: number;
    }>;
    limit: number;
  }> {
    const query = this.normalizeQuery(params.query);
    const limit = this.normalizeLimit(params.limit);
    const mode = this.resolveSearchMode(query);
    const cacheKey = JSON.stringify({ q: query, mode, limit });

    const cached = await this.cache.getCreators(cacheKey);
    if (cached) {
      return cached as {
        creators: Array<{
          userId: number;
          displayName: string | null;
          bio: string | null;
          influenceScore: number | null;
          audienceSize: number;
        }>;
        limit: number;
      };
    }

    const creators = await this.repository.searchCreators({
      query,
      limit,
      mode,
    });

    const response = {
      creators,
      limit,
    };

    await this.cache.setCreators(cacheKey, response);
    return response;
  }

  private normalizeQuery(value: string): string {
    return value.trim();
  }

  private normalizeLimit(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 10;
    }

    return Math.min(value, 50);
  }

  private resolveSearchMode(query: string): CreatorSearchMode {
    const normalized = query.trim();
    const tokenCount = normalized.split(/\s+/).filter(Boolean).length;

    if (normalized.length >= 30 || tokenCount >= 3) {
      return 'bio';
    }

    return 'name';
  }
}
