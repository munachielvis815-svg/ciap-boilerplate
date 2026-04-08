import { Injectable } from '@nestjs/common';
import {
  UnauthorizedUserActionException,
  UserNotFoundException,
} from '@common/exceptions';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import type { User } from '@database/drizzle/schema';
import type { RequestUser } from '@/types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Get a user by ID
   * @throws NotFoundException if user does not exist
   */
  async getUserById(id: number, actor: RequestUser): Promise<UserDto> {
    const user =
      actor.role === 'admin'
        ? await this.usersRepository.findById(id)
        : await this.usersRepository.findByIdAndTenant(id, actor.tenantId);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    if (actor.role === 'user' || actor.role === 'creator') {
      if (actor.id !== user.id) {
        throw new UnauthorizedUserActionException('access this user profile');
      }
    }

    return this.mapUserToDto(user);
  }

  /**
   * Get a user by email
   * @throws NotFoundException if user does not exist
   */
  async getUserByEmail(email: string): Promise<UserDto> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundException(email);
    }

    return this.mapUserToDto(user);
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(limit = 10, offset = 0, actor?: RequestUser): Promise<UserDto[]> {
    const users =
      actor && actor.role !== 'admin'
        ? await this.usersRepository.findAllByTenant(actor.tenantId, limit, offset)
        : await this.usersRepository.findAll(limit, offset);
    return users.map((user) => this.mapUserToDto(user));
  }

  /**
   * Map user entity to DTO (excludes sensitive fields)
   */
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
