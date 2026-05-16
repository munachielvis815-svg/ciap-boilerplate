import { ApiProperty } from '@nestjs/swagger';

export class CreatorCompareItemDto {
  @ApiProperty({ example: 12 })
  userId!: number;

  @ApiProperty({ example: 'Creator Name' })
  displayName!: string | null;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;
}

export class CreatorCompareResponseDto {
  @ApiProperty({ type: CreatorCompareItemDto, isArray: true })
  creators!: CreatorCompareItemDto[];

  @ApiProperty({ example: 'ids' })
  mode!: 'ids' | 'search';
}
