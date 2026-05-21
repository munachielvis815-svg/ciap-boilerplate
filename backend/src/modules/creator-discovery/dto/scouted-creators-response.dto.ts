import { ApiProperty } from '@nestjs/swagger';

export class ScoutedCreatorItemDto {
  @ApiProperty({ example: 12 })
  userId!: number;

  @ApiProperty({ example: 'Creator Name', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: 'scouted' })
  status!: string;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: 'gaming', nullable: true })
  category!: string | null;
}

export class ScoutedCreatorsResponseDto {
  @ApiProperty({ type: [ScoutedCreatorItemDto] })
  creators!: ScoutedCreatorItemDto[];
}
