import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { ApiHealthDto, DatabaseHealthDto, ReadinessHealthDto } from './dto/health.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    type: ApiHealthDto,
  })
  async check(): Promise<ApiHealthDto> {
    return this.healthService.check();
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection health' })
  @ApiResponse({
    status: 200,
    description: 'Database health status',
    type: DatabaseHealthDto,
  })
  async checkDb(): Promise<DatabaseHealthDto> {
    return this.healthService.checkDatabase();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if service is ready' })
  @ApiResponse({
    status: 200,
    description: 'Readiness status',
    type: ReadinessHealthDto,
  })
  async readiness(): Promise<ReadinessHealthDto> {
    return this.healthService.readiness();
  }
}
