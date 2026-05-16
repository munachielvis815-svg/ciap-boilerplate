import { Inject, Injectable, Logger } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '../database.module';
import type { Database } from '../database.module';
import { tenants, users, userProfiles } from '../drizzle/schema';
import { SEED_TENANTS, SEED_USERS } from './seed.data';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@Inject(DATABASE_PROVIDER) private readonly db: Database) {}

  async seedTestData(): Promise<void> {
    try {
      this.logger.log('Starting database seed...');

      const existingUsers = await this.db.query.users.findMany();
      if (existingUsers.length > 0) {
        this.logger.warn(
          `Database already has ${existingUsers.length} users. Skipping seed.`,
        );
        return;
      }

      const tenantSlugs = SEED_TENANTS.map((tenant) => tenant.slug);
      const existingTenants = await this.db
        .select({ id: tenants.id, slug: tenants.slug })
        .from(tenants)
        .where(inArray(tenants.slug, tenantSlugs));

      const existingTenantSlugs = new Set(
        existingTenants.map((tenant) => tenant.slug),
      );
      const missingTenants = SEED_TENANTS.filter(
        (tenant) => !existingTenantSlugs.has(tenant.slug),
      );

      if (missingTenants.length > 0) {
        this.logger.log(`Inserting ${missingTenants.length} tenants...`);
        const insertedTenants = await this.db
          .insert(tenants)
          .values(missingTenants)
          .returning({ id: tenants.id, slug: tenants.slug });
        existingTenants.push(...insertedTenants);
        this.logger.log('Tenants inserted successfully');
      } else {
        this.logger.log('Seed tenants already exist. Skipping tenant insert.');
      }

      const tenantIdBySlug = new Map(
        existingTenants.map((tenant) => [tenant.slug, tenant.id]),
      );

      const seedUsers = SEED_USERS.map((seedUser) => {
        const tenantId = tenantIdBySlug.get(seedUser.tenantSlug);
        if (!tenantId) {
          throw new Error(
            `Seed tenant not found for slug "${seedUser.tenantSlug}"`,
          );
        }

        const userData = seedUser;
        return {
          ...userData,
          tenantId,
        };
      });

      this.logger.log(`Inserting ${seedUsers.length} test users...`);
      await this.db.insert(users).values(seedUsers);
      this.logger.log('Users inserted successfully');

      const createdUsers = await this.db.query.users.findMany();
      if (createdUsers.length > 0) {
        const profiles = createdUsers.map((user) => ({
          userId: user.id,
          displayName: user.name,
          bio: null,
          location: null,
          industry: null,
          websiteUrl: null,
          avatarUrl: null,
          audienceSize: 0,
          influenceScore: null,
          influenceScoreUpdatedAt: null,
        }));

        await this.db.insert(userProfiles).values(profiles);
        this.logger.log('User profiles inserted successfully');
      }

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
      const profileRows = await this.db.query.userProfiles.findMany();
      return {
        seeded: userRows.length > 0,
        tenantCount: tenantRows.length,
        userCount: userRows.length,
        profileCount: profileRows.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get seed status', error);
      throw error;
    }
  }
}
