import { ApiProperty } from '@nestjs/swagger';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Tenant ID for multitenancy scope',
    example: 2,
  })
  tenantId!: number;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true,
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'User role for RBAC',
    enum: ROLE_VALUES,
    example: 'creator',
  })
  role!: AppRole;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
