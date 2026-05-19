import { ConfigService } from '@nestjs/config';
import { QueueConfigService } from './queue-config.service';

describe('QueueConfigService', () => {
  const createService = (redisUrl: string): QueueConfigService =>
    new QueueConfigService(new ConfigService({ REDIS_URL: redisUrl }));

  it('parses plain redis URLs with db index', () => {
    const service = createService('redis://:secret@localhost:6379/3');

    const config = service.getBaseConfig();

    expect(config.connection).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 6379,
        password: 'secret',
        db: 3,
      }),
    );
  });

  it('parses rediss URLs with TLS and ACL username', () => {
    const service = createService(
      'rediss://default:secret@cache.example.com:6380/4',
    );

    const config = service.getBaseConfig();

    expect(config.connection).toEqual(
      expect.objectContaining({
        host: 'cache.example.com',
        port: 6380,
        username: 'default',
        password: 'secret',
        db: 4,
        tls: {
          servername: 'cache.example.com',
        },
      }),
    );
  });

  it('defaults to db 0 when the URL has no db path', () => {
    const service = createService('redis://:secret@localhost:6379');

    const config = service.getBaseConfig();

    expect(config.connection).toEqual(
      expect.objectContaining({
        db: 0,
      }),
    );
  });

  it('throws for unsupported protocols', () => {
    const service = createService('https://cache.example.com');

    expect(() => service.getBaseConfig()).toThrow(
      'Invalid REDIS_URL format: https://cache.example.com (Unsupported Redis protocol: https:)',
    );
  });
});
