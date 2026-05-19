import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@guards/index';
import { SearchService } from './search.service';
import { CreatorSearchQueryDto } from './dto/creator-search-query.dto';
import { CreatorSearchResponseDto } from './dto/creator-search-response.dto';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('creators')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Universal creator search (name, niche, bio)',
  })
  @ApiResponse({
    status: 200,
    type: CreatorSearchResponseDto,
    schema: {
      example: {
        creators: [
          {
            userId: 12,
            displayName: 'Creator Name',
            bio: 'Gaming creator',
            influenceScore: 75.4,
            audienceSize: 120000,
          },
        ],
        limit: 10,
      },
    },
  })
  async searchCreators(@Query() query: CreatorSearchQueryDto) {
    return this.searchService.searchCreators({
      query: query.query,
      limit: query.limit ?? 10,
    });
  }
}
