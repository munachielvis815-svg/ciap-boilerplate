import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { CreatorOnboardDto } from './dto/creator-onboard.dto';
import { CreatorOnboardResponseDto } from './dto/creator-onboard-response.dto';
import { UserPlatformStatusDto } from './dto/user-platform-status.dto';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import { RequireAbilities, Roles } from '@decorators/index';
import type { AuthenticatedRequest } from '@/types/express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user dashboard data' })
  @ApiResponse({
    status: 200,
    type: MeResponseDto,
  })
  async getMe(@Req() request: AuthenticatedRequest): Promise<MeResponseDto> {
    return this.usersService.getMeDashboard(request.user);
  }

  @Post('me/onboard')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Onboard creator profile and types' })
  @ApiResponse({ status: 200, type: CreatorOnboardResponseDto })
  @Roles('creator')
  async onboardCreator(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatorOnboardDto,
  ): Promise<CreatorOnboardResponseDto> {
    return this.usersService.onboardCreator(request.user, dto);
  }

  /**
   * Get a user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserDto,
  })
  @Roles('admin', 'sme', 'creator')
  @RequireAbilities('users:read:any', 'users:read:tenant', 'users:read:self')
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  async getUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserDto> {
    return this.usersService.getUserById(id, request.user);
  }

  @Get(':id/platform-status')
  @ApiOperation({ summary: 'Get platform connected status for user' })
  @ApiResponse({ status: 200, type: UserPlatformStatusDto })
  @Roles('admin', 'sme', 'creator')
  @RequireAbilities('users:read:any', 'users:read:tenant', 'users:read:self')
  async getUserPlatformStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserPlatformStatusDto> {
    return this.usersService.getUserPlatformStatus(id, request.user);
  }

  /**
   * Get all users with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of users to return',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of users to skip',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserDto],
  })
  @Roles('sme')
  @RequireAbilities('users:list:tenant')
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() request?: AuthenticatedRequest,
  ): Promise<UserDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.usersService.getTenantUsers(
      parsedLimit,
      parsedOffset,
      request?.user,
    );
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all users across tenants (admin only)' })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of users to return',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of users to skip',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users across tenants',
    type: [UserDto],
  })
  @Roles('admin')
  @RequireAbilities('users:list:any')
  async getAllUsersAsAdmin(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<UserDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.usersService.getAllUsersForAdmin(parsedLimit, parsedOffset);
  }
}
