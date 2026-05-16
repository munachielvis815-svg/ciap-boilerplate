import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token issued at login. Optional when ciap_refresh cookie is present.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
