import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminSignupDto {
  @ApiProperty({
    example: 'admin.user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Platform Admin',
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'StrongAdminPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Shared secret for controlled admin onboarding.',
    example: 'change-me-admin-signup-key',
  })
  @IsString()
  @MinLength(12)
  adminSignupKey!: string;
}
