import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { DatabaseModule } from '@database/database.module';
import { CreatorInsightsModule } from '@modules/creator-insights/creator-insights.module';
import { CacheModule } from '@modules/cache/cache.module';
import { UsersCacheService } from './users-cache.service';

@Module({
  imports: [DatabaseModule, CreatorInsightsModule, CacheModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersCacheService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
