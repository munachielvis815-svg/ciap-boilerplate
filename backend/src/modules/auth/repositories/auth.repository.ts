import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import { auditLogs, oauthAccounts } from '@database/drizzle/schema';
import type {
  AuditLog,
  NewAuditLog,
  NewOauthAccount,
  OauthAccount,
  OauthGrantPurpose,
} from '@database/drizzle/schema';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async createAuditLog(data: NewAuditLog): Promise<AuditLog> {
    const [created] = await this.db.insert(auditLogs).values(data).returning();
    return created;
  }

  async findOauthAccount(
    provider: 'google' | 'github' | 'linkedin',
    providerUserId: string,
    purpose?: OauthGrantPurpose,
  ): Promise<OauthAccount | null> {
    const oauthAccount = await this.db.query.oauthAccounts.findFirst({
      where: purpose
        ? and(
            eq(oauthAccounts.provider, provider),
            eq(oauthAccounts.providerUserId, providerUserId),
            eq(oauthAccounts.purpose, purpose),
          )
        : and(
            eq(oauthAccounts.provider, provider),
            eq(oauthAccounts.providerUserId, providerUserId),
          ),
    });

    return oauthAccount || null;
  }

  async findOauthAccounts(
    provider: 'google' | 'github' | 'linkedin',
    providerUserId: string,
  ): Promise<OauthAccount[]> {
    return this.db.query.oauthAccounts.findMany({
      where: and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerUserId, providerUserId),
      ),
    });
  }

  async createOauthAccount(data: NewOauthAccount): Promise<OauthAccount> {
    const [created] = await this.db
      .insert(oauthAccounts)
      .values(data)
      .returning();
    return created;
  }

  async findOauthAccountByUserAndProvider(
    userId: number,
    provider: 'google' | 'github' | 'linkedin',
    purpose?: OauthGrantPurpose,
  ): Promise<OauthAccount | null> {
    const oauthAccount = await this.db.query.oauthAccounts.findFirst({
      where: purpose
        ? and(
            eq(oauthAccounts.userId, userId),
            eq(oauthAccounts.provider, provider),
            eq(oauthAccounts.purpose, purpose),
          )
        : and(
            eq(oauthAccounts.userId, userId),
            eq(oauthAccounts.provider, provider),
          ),
    });

    return oauthAccount || null;
  }

  async updateOauthAccountTokens(
    oauthAccountId: number,
    data: {
      accessToken?: string | null;
      refreshToken?: string | null;
      tokenExpiresAt?: Date | null;
      email?: string | null;
    },
  ): Promise<OauthAccount> {
    const [updated] = await this.db
      .update(oauthAccounts)
      .set({
        ...data,
      })
      .where(eq(oauthAccounts.id, oauthAccountId))
      .returning();

    return updated;
  }
}
