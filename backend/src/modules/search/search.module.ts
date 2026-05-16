import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { CacheModule } from '@modules/cache/cache.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { SearchCacheService } from './search-cache.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository, SearchCacheService],
  exports: [SearchService],
})
export class SearchModule {}
