import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { DatabaseModule } from '@database/database.module';
import { CreatorInsightsModule } from '@modules/creator-insights/creator-insights.module';
import { CacheModule } from '@modules/cache/cache.module';
import { UsersCacheService } from './services/users-cache.service';

@Module({
  imports: [DatabaseModule, CreatorInsightsModule, CacheModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersCacheService],
  exports: [UsersService, UsersRepository, UsersCacheService],
})
export class UsersModule {}
