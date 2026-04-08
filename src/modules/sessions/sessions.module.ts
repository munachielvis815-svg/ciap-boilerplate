import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

@Module({
  imports: [DatabaseModule],
  providers: [SessionsRepository, SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
