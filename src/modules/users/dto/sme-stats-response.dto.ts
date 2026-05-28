import { ApiProperty } from '@nestjs/swagger';

export class SmeStatsResponseDto {
  @ApiProperty({ example: 1850000 })
  totalReach!: number;

  @ApiProperty({ example: 72.4 })
  avgInfluenceScore!: number;

  @ApiProperty({ example: 120 })
  totalCreators!: number;

  @ApiProperty({ example: 84 })
  discoveryCoverage!: number;
}
