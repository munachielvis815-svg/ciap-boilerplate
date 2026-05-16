import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatorSearchQueryDto {
  @ApiProperty({
    description: 'Search creators by name, niche, or bio keywords.',
    example: 'gaming',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value as undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  })
  @IsString()
  @IsNotEmpty()
  query!: string;

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
}
