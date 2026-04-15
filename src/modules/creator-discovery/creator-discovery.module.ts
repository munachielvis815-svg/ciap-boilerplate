import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { CacheModule } from '@modules/cache/cache.module';
import { CreatorDiscoveryController } from './creator-discovery.controller';
import { CreatorDiscoveryService } from './creator-discovery.service';
import { CreatorDiscoveryRepository } from './creator-discovery.repository';
import { CreatorDiscoveryCacheService } from './creator-discovery-cache.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [CreatorDiscoveryController],
  providers: [
    CreatorDiscoveryService,
    CreatorDiscoveryRepository,
    CreatorDiscoveryCacheService,
  ],
})
export class CreatorDiscoveryModule {}
