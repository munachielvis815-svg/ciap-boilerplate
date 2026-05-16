import { Injectable, Inject } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import { userProfiles, users } from '@database/drizzle/schema';
import type { CreatorSearchMode } from './search.types';

@Injectable()
export class SearchRepository {
  private pgTrgmAvailable: boolean | null = null;

  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async searchCreators(params: {
    query: string;
    limit: number;
    mode: CreatorSearchMode;
  }) {
    const normalized = params.query.trim().toLowerCase();
    const like = `%${normalized}%`;
    const threshold = params.mode === 'bio' ? 0.12 : 0.2;

    const useTrgm = await this.resolvePgTrgmAvailability();

    if (!useTrgm) {
      const nameMatch = sql`(
        lower(${userProfiles.displayName}) ILIKE ${like}
        OR lower(${users.name}) ILIKE ${like}
        OR lower(${userProfiles.industry}) ILIKE ${like}
        OR lower(array_to_string(${userProfiles.creatorTypes}, ' ')) ILIKE ${like}
      )`;

      const bioMatch = sql`(
        lower(${userProfiles.bio}) ILIKE ${like}
        OR lower(${userProfiles.industry}) ILIKE ${like}
        OR lower(array_to_string(${userProfiles.creatorTypes}, ' ')) ILIKE ${like}
      )`;

      const matchClause = params.mode === 'bio' ? bioMatch : nameMatch;

      return this.db
        .select({
          userId: users.id,
          displayName: userProfiles.displayName,
          bio: userProfiles.bio,
          influenceScore: userProfiles.influenceScore,
          audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
        })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(sql`${users.role} = 'creator' AND ${matchClause}`)
        .orderBy(
          sql`${userProfiles.influenceScore} DESC NULLS LAST`,
          sql`${userProfiles.audienceSize} DESC`,
          sql`${users.id} DESC`,
        )
        .limit(params.limit);
    }

    const displayNameSimilarity = sql<number>`similarity(lower(${userProfiles.displayName}), ${normalized})`;
    const userNameSimilarity = sql<number>`similarity(lower(${users.name}), ${normalized})`;
    const bioSimilarity = sql<number>`similarity(lower(${userProfiles.bio}), ${normalized})`;
    const industrySimilarity = sql<number>`similarity(lower(${userProfiles.industry}), ${normalized})`;
    const creatorTypesSimilarity = sql<number>`similarity(lower(array_to_string(${userProfiles.creatorTypes}, ' ')), ${normalized})`;

    const rank = sql<number>`greatest(
      coalesce(${displayNameSimilarity}, 0),
      coalesce(${userNameSimilarity}, 0),
      coalesce(${bioSimilarity}, 0),
      coalesce(${industrySimilarity}, 0),
      coalesce(${creatorTypesSimilarity}, 0)
    )`;

    const nameMatch = sql`(
      ${displayNameSimilarity} >= ${threshold}
      OR ${userNameSimilarity} >= ${threshold}
      OR ${industrySimilarity} >= ${threshold}
      OR ${creatorTypesSimilarity} >= ${threshold}
      OR lower(${userProfiles.displayName}) ILIKE ${like}
      OR lower(${users.name}) ILIKE ${like}
      OR lower(${userProfiles.industry}) ILIKE ${like}
      OR lower(array_to_string(${userProfiles.creatorTypes}, ' ')) ILIKE ${like}
    )`;

    const bioMatch = sql`(
      ${bioSimilarity} >= ${threshold}
      OR ${industrySimilarity} >= ${threshold}
      OR ${creatorTypesSimilarity} >= ${threshold}
      OR lower(${userProfiles.bio}) ILIKE ${like}
      OR lower(${userProfiles.industry}) ILIKE ${like}
      OR lower(array_to_string(${userProfiles.creatorTypes}, ' ')) ILIKE ${like}
    )`;

    const matchClause = params.mode === 'bio' ? bioMatch : nameMatch;

    return this.db
      .select({
        userId: users.id,
        displayName: userProfiles.displayName,
        bio: userProfiles.bio,
        influenceScore: userProfiles.influenceScore,
        audienceSize: sql<number>`coalesce(${userProfiles.audienceSize}, 0)`,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(sql`${users.role} = 'creator' AND ${matchClause}`)
      .orderBy(
        sql`${rank} DESC`,
        sql`${userProfiles.influenceScore} DESC NULLS LAST`,
        sql`${userProfiles.audienceSize} DESC`,
        sql`${users.id} DESC`,
      )
      .limit(params.limit);
  }

  private async resolvePgTrgmAvailability(): Promise<boolean> {
    if (this.pgTrgmAvailable !== null) {
      return this.pgTrgmAvailable;
    }

    try {
      const result = await this.db.execute(
        sql`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS is_available`,
      );
      const rows = result as unknown as {
        rows?: Array<{ is_available?: boolean }>;
      };
      const available = rows.rows?.[0]?.is_available === true;
      this.pgTrgmAvailable = available;
      return available;
    } catch {
      this.pgTrgmAvailable = false;
      return false;
    }
  }
}
