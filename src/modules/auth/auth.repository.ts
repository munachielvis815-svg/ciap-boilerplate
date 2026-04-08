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
  ): Promise<OauthAccount | null> {
    const oauthAccount = await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerUserId, providerUserId),
      ),
    });

    return oauthAccount || null;
  }

  async createOauthAccount(data: NewOauthAccount): Promise<OauthAccount> {
    const [created] = await this.db.insert(oauthAccounts).values(data).returning();
    return created;
  }
}
