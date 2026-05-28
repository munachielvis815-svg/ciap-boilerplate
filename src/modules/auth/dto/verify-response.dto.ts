import { ApiProperty } from '@nestjs/swagger';
import { ROLE_VALUES } from '@constants/roles.constant';
import type { AppRole } from '@constants/roles.constant';

export class VerifyResponseDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: 1 })
  tenantId!: number;

  @ApiProperty({ enum: ROLE_VALUES, example: 'admin' })
  role!: AppRole;

  @ApiProperty({ example: '7b4e5e22-0a69-4de5-93b9-e46d9454b0f8' })
  sessionId!: string;
}
