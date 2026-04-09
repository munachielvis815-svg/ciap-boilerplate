import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '@database/database.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SocialsController } from './socials/socials.controller';
import { SocialsService } from './socials/socials.service';
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
    SocialsService,
    JwtStrategy,
    Oauth2StrategyScaffold,
  ],
  exports: [AuthService, SocialsService],
})
export class AuthModule {}
