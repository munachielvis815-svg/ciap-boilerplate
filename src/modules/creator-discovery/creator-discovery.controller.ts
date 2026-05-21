import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, RequireAbilities } from '@decorators/index';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import { CreatorDiscoveryService } from './creator-discovery.service';
import { CreatorDiscoveryQueryDto } from './dto/creator-discovery-query.dto';
import { CreatorDiscoveryResponseDto } from './dto/creator-discovery-response.dto';
import { CreatorCompareQueryDto } from './dto/creator-compare-query.dto';
import { CreatorCompareResponseDto } from './dto/creator-compare-response.dto';
import { CreatorProfileResponseDto } from './dto/creator-profile-response.dto';
import { CreatorProfileQueryDto } from './dto/creator-profile-query.dto';
import { SearchService } from '@modules/search/search.service';
import { CreatorSearchQueryDto } from '@modules/search/dto/creator-search-query.dto';
import { CreatorSearchResponseDto } from '@modules/search/dto/creator-search-response.dto';
import { ScoutedCreatorsResponseDto } from './dto/scouted-creators-response.dto';
import { ScoutCreatorResponseDto } from './dto/scout-creator-response.dto';
import type { AuthenticatedRequest } from '@/types/express';

@ApiTags('sme-creators')
@Controller('sme/creators')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class CreatorDiscoveryController {
  constructor(
    private readonly discoveryService: CreatorDiscoveryService,
    private readonly searchService: SearchService,
  ) {}

  @Get('discovery')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Discover creators for SME campaigns' })
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
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:discover:any')
  async discover(@Query() query: CreatorDiscoveryQueryDto) {
    return this.discoveryService.discoverCreators({
      query: query.query,
      bioQuery: query.bioQuery,
      platform: query.platform,
      minInfluenceScore: query.minInfluenceScore,
      maxInfluenceScore: query.maxInfluenceScore,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    });
  }

  @Get('compare')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Compare creators by IDs or by search query',
  })
  @ApiResponse({
    status: 200,
    type: CreatorCompareResponseDto,
    schema: {
      example: {
        creators: [
          {
            userId: 12,
            displayName: 'Creator Name',
            influenceScore: 75.4,
            audienceSize: 120000,
          },
          {
            userId: 18,
            displayName: 'Creator B',
            influenceScore: 68.1,
            audienceSize: 95000,
          },
        ],
        mode: 'ids',
      },
    },
  })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:compare:any')
  async compare(@Query() query: CreatorCompareQueryDto) {
    const ids = query.creatorIds
      ? query.creatorIds
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value))
      : undefined;

    return this.discoveryService.compareCreators({
      creatorIds: ids?.length ? ids : undefined,
      query: query.query,
      limit: query.limit ?? 5,
    });
  }

  @Get('search')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Search creators (delegates to universal search)',
  })
  @ApiResponse({
    status: 200,
    type: CreatorDiscoveryResponseDto,
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
        offset: 0,
      },
    },
  })
  async search(@Query() query: CreatorSearchQueryDto) {
    return this.searchService.searchCreators({
      query: query.query,
      limit: query.limit ?? 10,
    });
  }

  @Get(':id/profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get creator profile for SME dashboard' })
  @ApiResponse({
    status: 200,
    type: CreatorProfileResponseDto,
  })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:discover:any')
  async getCreatorProfile(
    @Param('id', ParseIntPipe) creatorId: number,
    @Query() query: CreatorProfileQueryDto,
  ) {
    const days = query.days ?? 30;
    const limit = query.limit ?? 10;
    return this.discoveryService.getCreatorProfileForSme({
      creatorId,
      days,
      limit,
    });
  }

  @Get('scouted')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List scouted creators for the authenticated SME' })
  @ApiResponse({
    status: 200,
    type: ScoutedCreatorsResponseDto,
  })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:discover:any')
  async getScoutedCreators(
    @Req() request: AuthenticatedRequest,
  ): Promise<ScoutedCreatorsResponseDto> {
    return this.discoveryService.getScoutedCreators(request.user);
  }

  @Post(':id/scout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a creator to the SME scouted list' })
  @ApiResponse({ status: 201, type: ScoutCreatorResponseDto })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:discover:any')
  async scoutCreator(
    @Param('id', ParseIntPipe) creatorId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<ScoutCreatorResponseDto> {
    return this.discoveryService.scoutCreator(creatorId, request.user);
  }

  @Delete(':id/scout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a creator from the SME scouted list' })
  @ApiResponse({ status: 200, type: ScoutCreatorResponseDto })
  @Roles('admin', 'sme')
  @RequireAbilities('sme:creator:discover:any')
  async unscoutCreator(
    @Param('id', ParseIntPipe) creatorId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<ScoutCreatorResponseDto> {
    return this.discoveryService.unscoutCreator(creatorId, request.user);
  }
}
