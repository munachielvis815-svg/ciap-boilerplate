import { ApiProperty } from '@nestjs/swagger';

export class ScoutCreatorResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}
