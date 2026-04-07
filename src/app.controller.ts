import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Health check',
    description: 'Returns API health status',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    example: {
      status: 'ok',
      timestamp: '2026-04-07T10:30:00.000Z',
      uptime: 3600,
    },
  })
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @ApiOperation({
    summary: 'Get API info',
    description: 'Returns API information and version',
  })
  @ApiResponse({
    status: 200,
    description: 'API information',
    example: {
      name: 'Test API',
      version: '1.0.0',
      environment: 'development',
    },
  })
  @Get()
  getInfo() {
    return this.appService.getInfo();
  }
}
