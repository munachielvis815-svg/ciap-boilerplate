import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token from client OAuth flow',
  })
  @IsString()
  @MinLength(10)
  idToken!: string;

  @ApiPropertyOptional({
    enum: ROLE_VALUES,
    example: 'user',
    description: 'Initial role when onboarding new Google user',
  })
  @IsOptional()
  @IsIn(ROLE_VALUES)
  role?: AppRole;
}
