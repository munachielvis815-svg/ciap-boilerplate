import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { SmeCampaignsController } from './controllers/sme-campaigns.controller';
import { SmeCampaignsRepository } from './repositories/sme-campaigns.repository';
import { SmeCampaignsService } from './services/sme-campaigns.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SmeCampaignsController],
  providers: [SmeCampaignsService, SmeCampaignsRepository],
})
export class SmeCampaignsModule {}
