import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApproveYoutubeChannelDto {
  @ApiProperty({
    description: 'YouTube channel ID to approve',
    example: 'UC123456789',
  })
  @IsString()
  @IsNotEmpty()
  youtubeChannelId!: string;
}
