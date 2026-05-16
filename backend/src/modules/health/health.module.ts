import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '@database/database.module';
import { CacheModule } from '@modules/cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
