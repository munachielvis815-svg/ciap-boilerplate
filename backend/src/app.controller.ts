import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
