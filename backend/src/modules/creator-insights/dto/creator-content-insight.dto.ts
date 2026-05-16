import { ApiProperty } from '@nestjs/swagger';

export class CreatorContentScoreDto {
  @ApiProperty({ example: 0.82, nullable: true })
  engagementScore!: number | null;

  @ApiProperty({ example: 0.76, nullable: true })
  growthScore!: number | null;

  @ApiProperty({ example: 0.88, nullable: true })
  recommendationScore!: number | null;

  @ApiProperty({ example: 3, nullable: true })
  performanceRank!: number | null;
}

export class CreatorContentItemDto {
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

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z', nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ type: CreatorContentScoreDto })
  score!: CreatorContentScoreDto;
}

export class CreatorContentInsightDto {
  @ApiProperty({ example: 'UC123456789', nullable: true })
  youtubeChannelId!: string | null;

  @ApiProperty({ type: CreatorContentItemDto, isArray: true })
  items!: CreatorContentItemDto[];

  @ApiProperty({ example: 10 })
  limit!: number;
}
