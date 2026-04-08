import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_PROVIDER } from '../database.module';
import type { Database } from '../database.module';
import {
  SEED_TENANTS,
  SEED_USERS,
  tenants,
  users,
} from '../drizzle/schema';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async seedTestData(): Promise<void> {
    try {
      this.logger.log('Starting database seed...');

      const existingUsers = await this.db.query.users.findMany();
      if (existingUsers.length > 0) {
        this.logger.warn(`Database already has ${existingUsers.length} users. Skipping seed.`);
        return;
      }

      this.logger.log(`Inserting ${SEED_TENANTS.length} tenants...`);
      await this.db.insert(tenants).values(SEED_TENANTS);
      this.logger.log('Tenants inserted successfully');

      this.logger.log(`Inserting ${SEED_USERS.length} test users...`);
      await this.db.insert(users).values(SEED_USERS);
      this.logger.log('Users inserted successfully');

      this.logger.log('Database seed completed successfully');
    } catch (error) {
      this.logger.error('Database seed failed', error);
      throw error;
    }
  }

  async clearTestData(): Promise<void> {
    try {
      this.logger.warn('Clearing all test data...');

      await this.db.delete(users);
      this.logger.log('Cleared users table');

      await this.db.delete(tenants);
      this.logger.log('Cleared tenants table');

      this.logger.log('Test data cleared');
    } catch (error) {
      this.logger.error('Failed to clear test data', error);
      throw error;
    }
  }

  async getStatus(): Promise<{
    seeded: boolean;
    tenantCount: number;
    userCount: number;
    profileCount: number;
    timestamp: string;
  }> {
    try {
      const tenantRows = await this.db.query.tenants.findMany();
      const userRows = await this.db.query.users.findMany();
      return {
        seeded: userRows.length > 0,
        tenantCount: tenantRows.length,
        userCount: userRows.length,
        profileCount: 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get seed status', error);
      throw error;
    }
  }
}
