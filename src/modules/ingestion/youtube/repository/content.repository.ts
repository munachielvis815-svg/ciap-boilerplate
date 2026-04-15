import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import {
  contentItems,
  contentMetrics,
  NewContentItem,
  NewContentMetric,
  ContentItem,
} from '@database/drizzle/schema';

@Injectable()
export class ContentRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async upsertContentItems(
    items: NewContentItem[],
  ): Promise<ContentItem[]> {
    if (items.length === 0) {
      return [];
    }

    return this.db
      .insert(contentItems)
      .values(items)
      .onConflictDoUpdate({
        target: [contentItems.platform, contentItems.externalId],
        set: {
          title: items[0]?.title ?? null,
          description: items[0]?.description ?? null,
          url: items[0]?.url ?? null,
          thumbnailUrl: items[0]?.thumbnailUrl ?? null,
          publishedAt: items[0]?.publishedAt ?? null,
          durationSeconds: items[0]?.durationSeconds ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  async insertMetrics(metrics: NewContentMetric[]): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    await this.db.insert(contentMetrics).values(metrics);
  }
}
