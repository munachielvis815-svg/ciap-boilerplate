import { Module } from '@nestjs/common';
import { YoutubeIngestionModule } from './youtube/youtube.module';

@Module({
  imports: [YoutubeIngestionModule],
})
export class IngestionModule {}
