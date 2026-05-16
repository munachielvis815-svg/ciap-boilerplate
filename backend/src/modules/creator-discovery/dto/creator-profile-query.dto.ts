import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreatorProfileQueryDto {
  @ApiPropertyOptional({
    description: 'Lookback window in days for performance metrics.',
    example: 30,
    minimum: 1,
    maximum: 90,
    default: 30,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of content items to return.',
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
}
