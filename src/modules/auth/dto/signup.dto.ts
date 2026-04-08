import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';

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
    enum: ROLE_VALUES,
    example: 'user',
  })
  @IsOptional()
  @IsIn(ROLE_VALUES)
  role?: AppRole;
}
