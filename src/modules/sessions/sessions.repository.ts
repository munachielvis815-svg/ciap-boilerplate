import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import { sessions } from '@database/drizzle/schema';
import type { NewSession, Session } from '@database/drizzle/schema';

@Injectable()
export class SessionsRepository {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async createSession(data: NewSession): Promise<Session> {
    const [created] = await this.db.insert(sessions).values(data).returning();
    return created;
  }

  async findActiveSessionById(sessionId: string): Promise<Session | null> {
    const now = new Date();
    const session = await this.db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, sessionId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    });

    return session || null;
  }

  async revokeSessionById(sessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
