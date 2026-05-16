import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { CacheModule } from '@modules/cache/cache.module';
import { CreatorInsightsController } from './creator-insights.controller';
import { CreatorInsightsService } from './creator-insights.service';
import { CreatorInsightsRepository } from './creator-insights.repository';
import { CreatorInsightsCacheService } from './creator-insights-cache.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [CreatorInsightsController],
  providers: [
    CreatorInsightsService,
    CreatorInsightsRepository,
    CreatorInsightsCacheService,
  ],
  exports: [CreatorInsightsService],
})
export class CreatorInsightsModule {}
