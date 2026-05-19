import { ApiProperty } from '@nestjs/swagger';

export class CreatorPerformanceTimeseriesPointDto {
  @ApiProperty({ example: '2026-04-01' })
  date!: string;

  @ApiProperty({ example: 120 })
  views!: number;

  @ApiProperty({ example: 15 })
  subscribersGained!: number;

  @ApiProperty({ example: 2 })
  subscribersLost!: number;

  @ApiProperty({ example: 340 })
  estimatedMinutesWatched!: number;
}

export class CreatorPerformanceGrowthDto {
  @ApiProperty({ example: 7 })
  windowDays!: number;

  @ApiProperty({ example: 120 })
  followerGrowth!: number;

  @ApiProperty({ example: 25000 })
  views!: number;

  @ApiProperty({ example: 54000 })
  estimatedMinutesWatched!: number;
}

export class CreatorPerformancePlatformDto {
  @ApiProperty({ example: 'youtube' })
  platform!: 'youtube' | 'tiktok' | 'instagram' | 'other';

  @ApiProperty({ example: 120, nullable: true })
  followerGrowth!: number | null;

  @ApiProperty({ example: 25000, nullable: true })
  views!: number | null;

  @ApiProperty({ example: 0.045, nullable: true })
  engagementRate!: number | null;
}

export class CreatorPerformanceContentItemDto {
  @ApiProperty({ example: 'dQw4w9WgXcQ' })
  youtubeVideoId!: string;

  @ApiProperty({ example: 'How to grow your channel' })
  title!: string | null;

  @ApiProperty({ example: 12000 })
  viewCount!: number;

  @ApiProperty({ example: 520 })
  likeCount!: number;

  @ApiProperty({ example: 85 })
  commentCount!: number;

  @ApiProperty({ example: 0.05 })
  engagementRate!: number;

  @ApiProperty({ example: 3, nullable: true })
  performanceRank!: number | null;
}

export class CreatorPerformanceInsightDto {
  @ApiProperty({ example: 30 })
  windowDays!: number;

  @ApiProperty({ type: CreatorPerformanceGrowthDto })
  weeklyGrowth!: CreatorPerformanceGrowthDto;

  @ApiProperty({ type: CreatorPerformanceGrowthDto })
  monthlyGrowth!: CreatorPerformanceGrowthDto;

  @ApiProperty({ type: CreatorPerformancePlatformDto, isArray: true })
  platforms!: CreatorPerformancePlatformDto[];

  @ApiProperty({ example: 0.045 })
  engagementRate!: number;

  @ApiProperty({ type: CreatorPerformanceContentItemDto, isArray: true })
  topContent!: CreatorPerformanceContentItemDto[];

  @ApiProperty({ type: CreatorPerformanceTimeseriesPointDto, isArray: true })
  timeSeries!: CreatorPerformanceTimeseriesPointDto[];

  @ApiProperty({ example: null, nullable: true })
  summary!: string | null;
}
