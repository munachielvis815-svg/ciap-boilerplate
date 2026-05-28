import { ApiProperty } from '@nestjs/swagger';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';
import { CreatorAudienceInsightDto } from '@modules/creator-insights/dto/creator-audience-insight.dto';
import { CreatorPerformanceInsightDto } from '@modules/creator-insights/dto/creator-performance-insight.dto';

export class MeProfileDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 2 })
  tenantId!: number;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;

  @ApiProperty({ enum: ROLE_VALUES, example: 'creator' })
  role!: AppRole;

  @ApiProperty({ example: 'Creator Name', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: 'Gaming creator', nullable: true })
  bio!: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.png',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ example: 120000 })
  audienceSize!: number;

  @ApiProperty({ example: 75.4, nullable: true })
  influenceScore!: number | null;

  @ApiProperty({ example: true })
  isOnboarded!: boolean;

  @ApiProperty({ example: ['gaming', 'lifestyle'] })
  creatorTypes!: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class PlatformConnectionDto {
  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiProperty({ example: '2026-04-20T12:00:00.000Z', nullable: true })
  connectedAt!: string | null;
}

export class PlatformStatusDto {
  @ApiProperty({ type: PlatformConnectionDto })
  youtube!: PlatformConnectionDto;

  @ApiProperty({ type: PlatformConnectionDto })
  tiktok!: PlatformConnectionDto;

  @ApiProperty({ type: PlatformConnectionDto })
  instagram!: PlatformConnectionDto;
}

export class CreatorDashboardDto {
  @ApiProperty({ type: CreatorAudienceInsightDto })
  audience!: CreatorAudienceInsightDto;

  @ApiProperty({ type: CreatorPerformanceInsightDto })
  performance!: CreatorPerformanceInsightDto;

  @ApiProperty({ example: null, nullable: true })
  summary!: string | null;
}

export class SmeCreatorStatsDto {
  @ApiProperty({ example: 120 })
  totalCreators!: number;
}

export class SmeSearchDefaultsDto {
  @ApiProperty({ example: ['youtube', 'tiktok', 'instagram', 'other'] })
  platformOptions!: Array<'youtube' | 'tiktok' | 'instagram' | 'other'>;

  @ApiProperty({ example: 0 })
  minInfluenceScore!: number;

  @ApiProperty({ example: 100 })
  maxInfluenceScore!: number;

  @ApiProperty({ example: 10 })
  defaultLimit!: number;
}

export class SmeDashboardDto {
  @ApiProperty({ type: SmeCreatorStatsDto })
  creatorStats!: SmeCreatorStatsDto;

  @ApiProperty({ type: SmeSearchDefaultsDto })
  searchDefaults!: SmeSearchDefaultsDto;
}

export class MeResponseDto {
  @ApiProperty({ enum: ROLE_VALUES, example: 'creator' })
  role!: AppRole;

  @ApiProperty({ type: MeProfileDto })
  profile!: MeProfileDto;

  @ApiProperty({ type: PlatformStatusDto })
  platformStatus!: PlatformStatusDto;

  @ApiProperty({ type: CreatorDashboardDto, nullable: true })
  creator!: CreatorDashboardDto | null;

  @ApiProperty({ type: SmeDashboardDto, nullable: true })
  sme!: SmeDashboardDto | null;
}
