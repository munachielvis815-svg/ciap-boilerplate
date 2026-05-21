import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional } from 'class-validator';

const CAMPAIGN_CREATOR_STATUS_VALUES = [
  'shortlisted',
  'invited',
  'active',
  'removed',
] as const;

export class AddCreatorToCampaignDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  creatorId!: number;

  @ApiPropertyOptional({
    enum: CAMPAIGN_CREATOR_STATUS_VALUES,
    example: 'shortlisted',
  })
  @IsOptional()
  @IsIn(CAMPAIGN_CREATOR_STATUS_VALUES)
  status?: (typeof CAMPAIGN_CREATOR_STATUS_VALUES)[number];
}
