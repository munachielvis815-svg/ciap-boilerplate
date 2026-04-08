import { ApiProperty } from '@nestjs/swagger';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';

export class AuthUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  name!: string;

  @ApiProperty({ enum: ROLE_VALUES, example: 'admin' })
  role!: AppRole;

  @ApiProperty({ example: 1 })
  tenantId!: number;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    description: 'Access token expiry in seconds',
    example: 900,
  })
  expiresIn!: number;
}
