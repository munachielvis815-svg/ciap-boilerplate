import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OAuth2Provider } from '../dto/oauth2-provider.dto';

@Injectable()
export class Oauth2StrategyScaffold {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Placeholder for provider-specific OAuth2 strategy wiring.
   * Implement with passport-oauth2 (or provider-specific passport strategies)
   * once provider credentials and callback flow requirements are finalized.
   */
  getAuthorizationUrl(_provider: OAuth2Provider): string {
    throw new NotImplementedException(
      'OAuth2 provider details are pending. Add provider client IDs, client secrets, callback URLs, and strategy mapping.',
    );
  }

  getCallbackUrl(provider: OAuth2Provider): string {
    const baseUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}/auth/oauth2/${provider}/callback`;
  }
}
