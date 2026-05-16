import { ApiProperty } from '@nestjs/swagger';

export class CreatorDiscoveryItemDto {
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

export class CreatorDiscoveryResponseDto {
  @ApiProperty({ type: CreatorDiscoveryItemDto, isArray: true })
  creators!: CreatorDiscoveryItemDto[];

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
