import { ApiProperty } from '@nestjs/swagger';

export class CampaignCreatorResponseDto {
  @ApiProperty({ example: 3 })
  campaignId!: number;

  @ApiProperty({ example: 12 })
  creatorId!: number;

  @ApiProperty({ example: 'Creator Name', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: 'shortlisted' })
  status!: string;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: '2026-05-21T10:15:00.000Z' })
  addedAt!: string;
}
