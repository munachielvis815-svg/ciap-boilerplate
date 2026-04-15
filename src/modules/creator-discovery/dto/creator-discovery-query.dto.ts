import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatorDiscoveryQueryDto {
  @ApiPropertyOptional({
    description: 'Search creators by name or bio keywords.',
    example: 'gaming',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by platform presence.',
    enum: ['youtube', 'tiktok', 'instagram', 'other'],
  })
  @IsOptional()
  @IsIn(['youtube', 'tiktok', 'instagram', 'other'])
  platform?: 'youtube' | 'tiktok' | 'instagram' | 'other';

  @ApiPropertyOptional({
    description: 'Minimum influence score.',
    example: 50,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minInfluenceScore?: number;

  @ApiPropertyOptional({
    description: 'Maximum influence score.',
    example: 95,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Max(100)
  maxInfluenceScore?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of creators to return.',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of creators to skip.',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number;
}
