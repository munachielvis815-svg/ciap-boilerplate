import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PUBLIC_ONBOARDING_ROLE_VALUES } from '@constants/roles.constant';
import type { PublicOnboardingRole } from '@constants/roles.constant';

export class SignupDto {
  @ApiProperty({
    example: 'new.user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'New User',
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    enum: PUBLIC_ONBOARDING_ROLE_VALUES,
    example: 'user',
    description:
      'Allowed public onboarding roles. Admin must use the dedicated admin flow.',
  })
  @IsOptional()
  @IsIn(PUBLIC_ONBOARDING_ROLE_VALUES)
  role?: PublicOnboardingRole;
}
