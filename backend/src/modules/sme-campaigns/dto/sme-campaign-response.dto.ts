import { ApiProperty } from '@nestjs/swagger';

export class SmeCampaignResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'Summer Tech Review' })
  name!: string;

  @ApiProperty({
    example: 'Creator campaign for Q3 product launch.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'draft' })
  status!: string;

  @ApiProperty({ example: 2500, nullable: true })
  budgetAmount!: number | null;

  @ApiProperty({ example: 'USD', nullable: true })
  budgetCurrency!: string | null;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  startsAt!: string | null;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z', nullable: true })
  endsAt!: string | null;

  @ApiProperty({ example: 0 })
  creatorCount!: number;

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z' })
  updatedAt!: string;
}
