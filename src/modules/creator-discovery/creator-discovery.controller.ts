import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
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

@ApiTags('sme-creators')
@Controller('sme/creators')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class CreatorDiscoveryController {
  constructor(private readonly discoveryService: CreatorDiscoveryService) {}

  @Get('discovery')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Discover creators for SME campaigns' })
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
    summary: 'Search creators (any authenticated role; MVP database query)',
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
  async search(@Query() query: CreatorDiscoveryQueryDto) {
    return this.discoveryService.searchCreators({
      query: query.query,
      bioQuery: query.bioQuery,
      platform: query.platform,
      minInfluenceScore: query.minInfluenceScore,
      maxInfluenceScore: query.maxInfluenceScore,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
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
}
