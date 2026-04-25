import { ApiProperty } from '@nestjs/swagger';
import { CreatorPerformanceInsightDto } from '@modules/creator-insights/dto/creator-performance-insight.dto';

export class CreatorProfileSummaryDto {
  @ApiProperty({ example: 12 })
  userId!: number;

  @ApiProperty({ example: 'Creator Name', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: 'Gaming creator', nullable: true })
  bio!: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.png',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;
}

export class CreatorChannelSummaryDto {
  @ApiProperty({ example: 'UC123456789', nullable: true })
  youtubeChannelId!: string | null;

  @ApiProperty({ example: 'My Channel', nullable: true })
  channelTitle!: string | null;

  @ApiProperty({ example: 12000 })
  subscriberCount!: number;

  @ApiProperty({ example: 450000 })
  totalViewCount!: number;

  @ApiProperty({ example: 120 })
  videoCount!: number;
}

export class CreatorAudienceDemographicsDto {
  @ApiProperty({
    example: [{ range: '18-24', percent: 42 }],
  })
  ageGroups!: Array<{ range: string; percent: number }>;

  @ApiProperty({ example: { male: 55, female: 42, other: 3 } })
  genderSplit!: { male: number; female: number; other: number } | null;

  @ApiProperty({ example: [{ location: 'US', percent: 35 }] })
  topLocations!: Array<{ location: string; percent: number }>;
}

export class CreatorSentimentAnalysisDto {
  @ApiProperty({ example: 0.72, nullable: true })
  overallScore!: number | null;

  @ApiProperty({ example: ['funny', 'authentic'] })
  topKeywords!: string[];

  @ApiProperty({ example: null, nullable: true })
  summary!: string | null;
}

export class CreatorProfileResponseDto {
  @ApiProperty({ type: CreatorProfileSummaryDto })
  profile!: CreatorProfileSummaryDto;

  @ApiProperty({ type: CreatorChannelSummaryDto, nullable: true })
  channel!: CreatorChannelSummaryDto | null;

  @ApiProperty({ type: CreatorAudienceDemographicsDto })
  audienceDemographics!: CreatorAudienceDemographicsDto;

  @ApiProperty({ type: CreatorPerformanceInsightDto, nullable: true })
  contentPerformance!: CreatorPerformanceInsightDto | null;

  @ApiProperty({ type: CreatorSentimentAnalysisDto })
  sentiment!: CreatorSentimentAnalysisDto;
}
