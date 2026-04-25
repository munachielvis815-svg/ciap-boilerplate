import { Injectable } from '@nestjs/common';
import {
  InvalidTokenException,
  UnauthorizedUserActionException,
  UserNotFoundException,
} from '@common/exceptions';
import { CreatorInsightsService } from '@modules/creator-insights/creator-insights.service';
import type { OauthAccount, User, UserProfile } from '@database/drizzle/schema';
import type { RequestUser } from '@/types';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { MeResponseDto } from './dto/me-response.dto';
import type { CreatorOnboardDto } from './dto/creator-onboard.dto';
import type { CreatorOnboardResponseDto } from './dto/creator-onboard-response.dto';
import type { UserPlatformStatusDto } from './dto/user-platform-status.dto';
import { UsersCacheService } from './users-cache.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly creatorInsightsService: CreatorInsightsService,
    private readonly usersCache: UsersCacheService,
  ) {}

  /**
   * Get a user by ID
   * @throws NotFoundException if user does not exist
   */
  async getUserById(id: number, actor: RequestUser): Promise<UserDto> {
    const user = await this.getAccessibleUserOrThrow(id, actor);
    return this.mapUserToDto(user);
  }

  /**
   * Get a user by email
   * @throws NotFoundException if user does not exist
   */
  async getUserByEmail(email: string): Promise<UserDto> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundException(email);
    }

    return this.mapUserToDto(user);
  }

  /**
   * Get all users with pagination
   */
  async getTenantUsers(
    limit = 10,
    offset = 0,
    actor?: RequestUser,
  ): Promise<UserDto[]> {
    if (!actor) {
      throw new InvalidTokenException({ reason: 'missing-auth-context' });
    }

    const users = await this.usersRepository.findAllByTenant(
      actor.tenantId,
      limit,
      offset,
    );
    return users.map((user) => this.mapUserToDto(user));
  }

  async getAllUsersForAdmin(limit = 10, offset = 0): Promise<UserDto[]> {
    const users = await this.usersRepository.findAll(limit, offset);
    return users.map((user) => this.mapUserToDto(user));
  }

  async onboardCreator(
    actor: RequestUser,
    dto: CreatorOnboardDto,
  ): Promise<CreatorOnboardResponseDto> {
    if (actor.role !== 'creator') {
      throw new UnauthorizedUserActionException('onboard a creator profile');
    }

    const [user, existingProfile] = await Promise.all([
      this.usersRepository.findByIdOrNull(actor.id),
      this.usersRepository.getProfileByUserId(actor.id),
    ]);

    if (!user) {
      throw new InvalidTokenException({ reason: 'user-not-found' });
    }

    const creatorTypes = this.normalizeCreatorTypes(dto.creatorTypes);
    const updatedProfile = await this.usersRepository.upsertProfile({
      userId: actor.id,
      displayName:
        this.normalizeOptionalString(dto.displayName) ??
        existingProfile?.displayName ??
        user.name,
      bio: this.normalizeOptionalString(dto.bio),
      location: this.normalizeOptionalString(dto.location),
      industry: this.normalizeOptionalString(dto.industry),
      websiteUrl: this.normalizeOptionalString(dto.websiteUrl),
      avatarUrl: this.normalizeOptionalString(dto.avatarUrl),
      creatorTypes,
      isOnboarded: true,
      audienceSize: dto.audienceSize,
    });

    await this.usersCache.deleteMe(actor.id);

    return {
      isOnboarded: updatedProfile.isOnboarded,
      creatorTypes: updatedProfile.creatorTypes,
    };
  }

  async getMeDashboard(actor: RequestUser): Promise<MeResponseDto> {
    const cached = await this.usersCache.getMe(actor.id);
    if (cached) {
      return cached as unknown as MeResponseDto;
    }

    const [user, profile, googleOauth] = await Promise.all([
      this.usersRepository.findByIdOrNull(actor.id),
      this.usersRepository.getProfileByUserId(actor.id),
      this.usersRepository.findOauthAccountByUserAndProvider(
        actor.id,
        'google',
      ),
    ]);

    if (!user) {
      throw new InvalidTokenException({ reason: 'user-not-found' });
    }

    const platformStatus = this.buildPlatformStatus(googleOauth);
    const profileDto = this.buildMeProfile(user, profile);

    if (user.role === 'creator') {
      const [audience, performance] = await Promise.all([
        this.creatorInsightsService.getAudienceInsights(actor, 30),
        this.creatorInsightsService.getPerformanceInsights(actor, 30, 10),
      ]);

      const response: MeResponseDto = {
        role: user.role,
        profile: profileDto,
        platformStatus,
        creator: {
          audience,
          performance,
          summary: null,
        },
        sme: null,
      };

      await this.usersCache.setMe(actor.id, response);
      return response;
    }

    if (user.role === 'sme' || user.role === 'admin') {
      const totalCreators = await this.usersRepository.countByRole('creator');

      const response: MeResponseDto = {
        role: user.role,
        profile: profileDto,
        platformStatus,
        creator: null,
        sme: {
          creatorStats: {
            totalCreators,
          },
          searchDefaults: {
            platformOptions: [
              'youtube',
              'tiktok',
              'instagram',
              'other',
            ] as const,
            minInfluenceScore: 0,
            maxInfluenceScore: 100,
            defaultLimit: 10,
          },
        },
      };

      await this.usersCache.setMe(actor.id, response);
      return response;
    }

    const response: MeResponseDto = {
      role: user.role,
      profile: profileDto,
      platformStatus,
      creator: null,
      sme: null,
    };

    await this.usersCache.setMe(actor.id, response);
    return response;
  }

  async getUserPlatformStatus(
    id: number,
    actor: RequestUser,
  ): Promise<UserPlatformStatusDto> {
    const user = await this.getAccessibleUserOrThrow(id, actor);
    const googleOauth =
      await this.usersRepository.findOauthAccountByUserAndProvider(
        user.id,
        'google',
      );

    return this.buildPlatformStatus(googleOauth);
  }

  /**
   * Map user entity to DTO (excludes sensitive fields)
   */
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async getAccessibleUserOrThrow(
    id: number,
    actor: RequestUser,
  ): Promise<User> {
    const user =
      actor.role === 'admin'
        ? await this.usersRepository.findById(id)
        : await this.usersRepository.findByIdAndTenant(id, actor.tenantId);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    if (actor.role === 'creator' && actor.id !== user.id) {
      throw new UnauthorizedUserActionException('access this user profile');
    }

    return user;
  }

  private buildMeProfile(
    user: User,
    profile: UserProfile | null,
  ): MeResponseDto['profile'] {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tenantId: user.tenantId,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      displayName: profile?.displayName ?? null,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      audienceSize: profile?.audienceSize ?? 0,
      influenceScore: profile?.influenceScore ?? null,
      isOnboarded: profile?.isOnboarded ?? false,
      creatorTypes: profile?.creatorTypes ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private buildPlatformStatus(
    googleOauth: OauthAccount | null,
  ): UserPlatformStatusDto {
    return {
      youtube: {
        connected: Boolean(
          googleOauth?.accessToken || googleOauth?.refreshToken,
        ),
        connectedAt: googleOauth?.updatedAt
          ? googleOauth.updatedAt.toISOString()
          : null,
      },
      tiktok: { connected: false, connectedAt: null },
      instagram: { connected: false, connectedAt: null },
    };
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeCreatorTypes(values: string[]): string[] {
    return Array.from(
      new Set(
        values
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0),
      ),
    );
  }
}
