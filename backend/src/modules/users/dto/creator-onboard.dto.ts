import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreatorOnboardDto {
  @ApiProperty({
    example: ['gaming', 'lifestyle'],
    description: 'Creator categories/genres (multiple allowed).',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  creatorTypes!: string[];

  @ApiPropertyOptional({ example: 'Creator Name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Gaming creator' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Lagos, NG' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Gaming' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(1000000000)
  audienceSize?: number;
}
