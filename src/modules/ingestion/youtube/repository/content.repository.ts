import { Injectable, Inject } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
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

  async upsertContentItems(items: NewContentItem[]): Promise<ContentItem[]> {
    if (items.length === 0) {
      return [];
    }

    return this.db
      .insert(contentItems)
      .values(items)
      .onConflictDoUpdate({
        target: [contentItems.platform, contentItems.externalId],
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          url: sql`excluded.url`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          publishedAt: sql`excluded.published_at`,
          durationSeconds: sql`excluded.duration_seconds`,
          updatedAt: sql`now()`,
        },
      })
      .returning();
  }

  /**
   * Replace existing metrics for the covered period dates, then insert fresh rows.
   * Uses a transaction to ensure atomicity — the table has no unique constraint yet,
   * so delete-then-insert is the safest way to prevent unbounded duplicate row growth.
   */
  async insertMetrics(metrics: NewContentMetric[]): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    // Collect the distinct (userId, platform, periodStart) combinations that
    // this batch covers so we can remove stale rows before re-inserting.
    const coveredDates = [
      ...new Set(
        metrics
          .filter((m) => m.periodStart != null)
          .map((m) => (m.periodStart as Date).toISOString()),
      ),
    ];

    await this.db.transaction(async (tx) => {
      if (coveredDates.length > 0) {
        const userId = metrics[0].userId;
        const platform = metrics[0].platform;

        await tx
          .delete(contentMetrics)
          .where(
            and(
              eq(contentMetrics.userId, userId),
              eq(contentMetrics.platform, platform),
              inArray(
                contentMetrics.periodStart,
                coveredDates.map((d) => new Date(d)),
              ),
            ),
          );
      }

      await tx.insert(contentMetrics).values(metrics);
    });
  }
}
