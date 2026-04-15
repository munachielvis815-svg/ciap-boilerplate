import { Injectable, Inject } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '@database/database.module';
import type { Database } from '@database/database.module';
import { tenants, users, userProfiles } from '@database/drizzle/schema';
import type {
  NewTenant,
  NewUser,
  Tenant,
  User,
  NewUserProfile,
  UserProfile,
} from '@database/drizzle/schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_PROVIDER) private db: Database) {}

  /**
   * Find a user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    return result || null;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    return result || null;
  }

  /**
   * Create user and return created row
   */
  async create(data: NewUser): Promise<User> {
    const [created] = await this.db.insert(users).values(data).returning();
    return created;
  }

  async createProfile(data: NewUserProfile): Promise<UserProfile> {
    const [created] = await this.db
      .insert(userProfiles)
      .values(data)
      .returning();
    return created;
  }

  /**
   * Find a user by ID
   */
  async findByIdOrNull(id: number): Promise<User | null> {
    return this.findById(id);
  }

  /**
   * Mark email as verified
   */
  async markEmailVerified(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({
        isEmailVerified: true,
      })
      .where(eq(users.id, userId));
  }

  /**
   * Track user last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Get all users (pagination ready)
   */
  async findAll(limit = 10, offset = 0): Promise<User[]> {
    return this.db.query.users.findMany({
      limit,
      offset,
    });
  }

  /**
   * Get users by tenant with pagination
   */
  async findAllByTenant(
    tenantId: number,
    limit = 10,
    offset = 0,
  ): Promise<User[]> {
    return this.db.query.users.findMany({
      where: eq(users.tenantId, tenantId),
      limit,
      offset,
    });
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.tenantId, tenantId)),
    });

    return result || null;
  }

  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    return tenant || null;
  }

  async createTenant(data: NewTenant): Promise<Tenant> {
    const [created] = await this.db.insert(tenants).values(data).returning();
    return created;
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    const result = await this.db.select({ value: count() }).from(users);
    return Number(result[0]?.value ?? 0);
  }
}
