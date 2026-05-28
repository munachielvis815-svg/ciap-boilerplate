import { Injectable } from '@nestjs/common';
import type { NewSession, Session } from '@database/drizzle/schema';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  createSession(data: NewSession): Promise<Session> {
    return this.sessionsRepository.createSession(data);
  }

  findActiveSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionsRepository.findActiveSessionById(sessionId);
  }

  revokeSessionById(sessionId: string): Promise<void> {
    return this.sessionsRepository.revokeSessionById(sessionId);
  }

  revokeAllUserSessions(userId: number): Promise<void> {
    return this.sessionsRepository.revokeAllUserSessions(userId);
  }
}
