import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const OAUTH2_PROVIDER_VALUES = ['google', 'github', 'linkedin'] as const;

export type OAuth2Provider = (typeof OAUTH2_PROVIDER_VALUES)[number];

export class OAuth2ProviderDto {
  @ApiProperty({
    enum: OAUTH2_PROVIDER_VALUES,
    example: 'google',
  })
  @IsIn(OAUTH2_PROVIDER_VALUES)
  provider!: OAuth2Provider;
}
