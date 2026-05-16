import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Current password (required if an existing password is set)',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ description: 'New password', required: true, minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
