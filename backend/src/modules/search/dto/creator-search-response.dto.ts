import { ApiProperty } from '@nestjs/swagger';

export class CreatorSearchItemDto {
  @ApiProperty({ example: 12 })
  userId!: number;

  @ApiProperty({ example: 'Creator Name' })
  displayName!: string | null;

  @ApiProperty({ example: 'Gaming creator' })
  bio!: string | null;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;
}

export class CreatorSearchResponseDto {
  @ApiProperty({ type: CreatorSearchItemDto, isArray: true })
  creators!: CreatorSearchItemDto[];

  @ApiProperty({ example: 10 })
  limit!: number;
}
