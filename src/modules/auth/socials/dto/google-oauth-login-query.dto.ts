import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GoogleOauthLoginQueryDto {
  @ApiPropertyOptional({
    enum: ['sme', 'creator'],
    example: 'creator',
    description: 'Optional role hint for first-time Google OAuth login.',
  })
  @IsOptional()
  @IsIn(['sme', 'creator'])
  role?: 'sme' | 'creator';
}
