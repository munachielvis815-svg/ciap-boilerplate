import { ApiProperty } from '@nestjs/swagger';

export class ApiHealthDto {
  @ApiProperty({
    description: 'Health status',
    enum: ['ok'],
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Server uptime in seconds',
    example: 1234.56,
  })
  uptime!: number;

  @ApiProperty({
    description: 'Node environment',
    example: 'development',
  })
  environment!: string;

  @ApiProperty({
    description: 'API version',
    example: '1.0.0',
  })
  version!: string;
}

export class DatabaseHealthDto {
  @ApiProperty({
    description: 'Database health status',
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status!: 'ok' | 'error';

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Health message',
    example: 'Database connection successful',
  })
  message!: string;

  @ApiProperty({
    description: 'Database connection status',
    enum: ['connected', 'disconnected'],
    example: 'connected',
  })
  database!: 'connected' | 'disconnected';

  @ApiProperty({
    description: 'Error message when status is error',
    required: false,
    example: 'Connection timeout',
  })
  error?: string;
}

export class CacheHealthDto {
  @ApiProperty({
    description: 'Cache health status',
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status!: 'ok' | 'error';

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Health message',
    example: 'Redis cache connection successful',
  })
  message!: string;

  @ApiProperty({
    description: 'Cache connection status',
    enum: ['connected', 'disconnected'],
    example: 'connected',
  })
  cache!: 'connected' | 'disconnected';

  @ApiProperty({
    description: 'Error message when status is error',
    required: false,
    example: 'Connection timeout',
  })
  error?: string;
}

export class ReadinessHealthDto {
  @ApiProperty({
    description: 'Service readiness status',
    enum: ['ok', 'unavailable'],
    example: 'ok',
  })
  status!: 'ok' | 'unavailable';

  @ApiProperty({
    description: 'Timestamp of readiness check',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Readiness message',
    example: 'Service is ready',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether service is ready',
    example: true,
  })
  ready!: boolean;
}
