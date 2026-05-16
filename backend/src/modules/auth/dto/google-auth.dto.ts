import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PUBLIC_ONBOARDING_ROLE_VALUES } from '@constants/roles.constant';
import type { PublicOnboardingRole } from '@constants/roles.constant';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token from client OAuth flow',
  })
  @IsString()
  @MinLength(10)
  idToken!: string;

  @ApiPropertyOptional({
    enum: PUBLIC_ONBOARDING_ROLE_VALUES,
    example: 'creator',
    description:
      'Initial role for first-time social onboarding (sme, creator only). Admin is not allowed here.',
  })
  @IsOptional()
  @IsIn(PUBLIC_ONBOARDING_ROLE_VALUES)
  role?: PublicOnboardingRole;
}
