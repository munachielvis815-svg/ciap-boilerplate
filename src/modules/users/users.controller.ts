import { Controller, Get, Param, Query, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { AbilitiesGuard, JwtAuthGuard, RolesGuard } from '@guards/index';
import { RequireAbilities, Roles } from '@decorators/index';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    email: string;
    role: 'admin' | 'user' | 'sme' | 'creator';
    sessionId: string;
    tenantId: number;
  };
};

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, AbilitiesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  @Roles('admin', 'user', 'sme', 'creator')
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
  @Roles('admin', 'sme')
  @RequireAbilities('users:list:any', 'users:list:tenant')
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() request?: AuthenticatedRequest,
  ): Promise<UserDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.usersService.getAllUsers(parsedLimit, parsedOffset, request?.user);
  }
}
