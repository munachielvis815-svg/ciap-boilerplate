import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { PoolClient } from 'pg';
import {
  createDatabase,
  createDatabasePool,
  type SharedDatabase,
} from '@shared/database/client';

const logger = new Logger('DatabaseModule');

export const DATABASE_PROVIDER = 'DATABASE_CONNECTION';

export type Database = SharedDatabase;

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_PROVIDER,
      useFactory: async (configService: ConfigService): Promise<Database> => {
        const connectionString = configService.get<string>('DATABASE_URL');

        if (!connectionString) {
          throw new Error(
            'DATABASE_URL environment variable is not set. Check your .env file.',
          );
        }

        logger.debug(`Connecting to database...`);

        const pool = createDatabasePool(connectionString);

        // Test connection
        let client: PoolClient | null = null;
        try {
          client = await pool.connect();
          const result = await client.query('SELECT NOW()');
          const now = (result.rows[0] as Record<string, unknown>).now;
          logger.log(`Database connected successfully at ${String(now)}`);
        } catch (error) {
          logger.error('Failed to connect to database', error);
          throw error;
        } finally {
          if (client) {
            client.release();
          }
        }

        return createDatabase(pool);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_PROVIDER],
})
export class DatabaseModule implements OnModuleInit {
  onModuleInit(): void {
    logger.log('Database module initialized');
  }
}
