import { ApiProperty } from '@nestjs/swagger';

export class CreatorOnboardResponseDto {
  @ApiProperty({ example: true })
  isOnboarded!: boolean;

  @ApiProperty({ example: ['gaming', 'lifestyle'] })
  creatorTypes!: string[];
}
