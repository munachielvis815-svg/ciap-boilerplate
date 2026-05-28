import { ApiProperty } from '@nestjs/swagger';

export class CreatorChannelSummaryDto {
  @ApiProperty({ example: 'UC123456789' })
  youtubeChannelId!: string | null;

  @ApiProperty({ example: 'My Channel' })
  channelTitle!: string | null;

  @ApiProperty({ example: 12000 })
  subscriberCount!: number;

  @ApiProperty({ example: 450000 })
  totalViewCount!: number;

  @ApiProperty({ example: 120 })
  videoCount!: number;
}

export class CreatorAudienceMetricsDto {
  @ApiProperty({ example: 25000 })
  views!: number;

  @ApiProperty({ example: 60000 })
  estimatedMinutesWatched!: number;

  @ApiProperty({ example: 210 })
  averageViewDurationSeconds!: number;

  @ApiProperty({ example: 120 })
  subscribersGained!: number;

  @ApiProperty({ example: 30 })
  subscribersLost!: number;
}

export class CreatorAudienceInsightDto {
  @ApiProperty({ type: CreatorChannelSummaryDto, nullable: true })
  channel!: CreatorChannelSummaryDto | null;

  @ApiProperty({ type: CreatorAudienceMetricsDto })
  audience!: CreatorAudienceMetricsDto;

  @ApiProperty({ example: 78.5, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: 30 })
  windowDays!: number;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z', nullable: true })
  syncedAt!: string | null;
}
