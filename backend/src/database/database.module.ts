import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
<<<<<<< HEAD
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import * as schema from './drizzle/schema';
=======
import type { PoolClient } from 'pg';
import {
  createDatabase,
  createDatabasePool,
  type SharedDatabase,
} from '@shared/database/client';
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56

const logger = new Logger('DatabaseModule');

export const DATABASE_PROVIDER = 'DATABASE_CONNECTION';

<<<<<<< HEAD
export type Database = NodePgDatabase<typeof schema>;
=======
export type Database = SharedDatabase;
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56

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

<<<<<<< HEAD
        const pool = new Pool({
          connectionString,
          max: Number(process.env.DB_POOL_MAX || 20),
          idleTimeoutMillis: Number(
            process.env.DB_POOL_IDLE_TIMEOUT_MS || 30_000,
          ),
          connectionTimeoutMillis: Number(
            process.env.DB_POOL_CONNECTION_TIMEOUT_MS || 5_000,
          ),
        });
=======
        const pool = createDatabasePool(connectionString);
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56

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

<<<<<<< HEAD
        const db = drizzle(pool, { schema });
        return db;
=======
        return createDatabase(pool);
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56
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
