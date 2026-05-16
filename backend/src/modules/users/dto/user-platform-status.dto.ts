import { ApiProperty } from '@nestjs/swagger';

export class PlatformConnectionDto {
  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiProperty({ example: '2026-04-20T12:00:00.000Z', nullable: true })
  connectedAt!: string | null;
}

export class UserPlatformStatusDto {
  @ApiProperty({ type: PlatformConnectionDto })
  youtube!: PlatformConnectionDto;

  @ApiProperty({ type: PlatformConnectionDto })
  tiktok!: PlatformConnectionDto;

  @ApiProperty({ type: PlatformConnectionDto })
  instagram!: PlatformConnectionDto;
}
