import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@database/database.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthGoogleOauthService } from './services/auth-google-oauth.service';
import { AuthService } from './services/auth.service';
import { AuthTokensService } from './services/auth-tokens.service';
import { SocialsController } from './socials/controllers/socials.controller';
import { SocialsService } from './socials/services/socials.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Oauth2StrategyScaffold } from './strategies/oauth2.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DatabaseModule,
    UsersModule,
    SessionsModule,
  ],
  controllers: [AuthController, SocialsController],
  providers: [
    AuthService,
    AuthRepository,
    AuthGoogleOauthService,
    AuthTokensService,
    SocialsService,
    JwtStrategy,
    Oauth2StrategyScaffold,
  ],
  exports: [AuthService, SocialsService],
})
export class AuthModule {}
