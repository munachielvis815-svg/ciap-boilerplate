# Project Guidelines & Agent Instructions

**Project**: NestJS v11 API with Drizzle ORM + PostgreSQL  
**Last Updated**: 2026-04-07  
**Version**: 1.0.0

---

## Quick Reference

- **Framework**: NestJS v11 + TypeScript
- **ORM**: Drizzle ORM v0.45
- **Database**: PostgreSQL (NeonDB)
- **Package Manager**: pnpm (exclusive)
- **API Docs**: Swagger/OpenAPI at `/api`
- **Documentation**: See `/docs/` folder

---

## Core Principles

### 1. Minimize Impact
- **Only touch what's necessary** — no unnecessary refactoring
- **No side effects** — changes must be isolated
- **Single responsibility** — each change addresses one concern
- **Backward compatible** — don't break existing functionality

### 2. No Laziness
- **Complete implementations** — don't take shortcuts
- **Proper typing** — no `any` types
- **Full test coverage** — especially for critical paths
- **Documentation** — document as you code
- **Error handling** — handle errors explicitly

### 3. Simplicity First
- **Choose clarity over cleverness** — readability is king
- **KISS principle** — Keep It Simple, Stupid
- **Don't over-engineer** — avoid unnecessary complexity
- **Obvious solutions** — prefer the most obvious implementation
- **Self-documenting code** — names, types, and structure should be clear

### 4. Type Safety
- **Strict TypeScript** — no implicit any
- **Interface-based** — contracts over implementations
- **Exhaustive checks** — handle all cases
- **Null safety** — strict null checks enabled
- **Return types** — always explicitly specified

### 5. SOLID Principles
- **Single Responsibility** — one reason to change
- **Open/Closed** — open for extension, closed for modification
- **Liskov Substitution** — subtypes must be substitutable
- **Interface Segregation** — depend on specific interfaces
- **Dependency Inversion** — depend on abstractions, not concretions

---

## Project Structure

```
src/
├── modules/          # Feature modules
├── common/           # Shared utilities
├── database/         # Drizzle configuration
├── config/           # Configuration
├── app.module.ts     # Root module
├── main.ts           # Entry point
└── types/            # TypeScript types

docs/
├── findings.md       # Auto-updated discoveries
├── project-structure.md  # Architecture guide
├── api.md            # API endpoints
├── database.md       # Database schema
└── patterns.md       # Code patterns
```

Full structure in [project-structure.md](../docs/project-structure.md).

---

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Classes | PascalCase | `UserService`, `CreateUserDto` |
| Functions/Methods | camelCase | `getUserById()`, `validateEmail()` |
| Constants | UPPER_SNAKE_CASE | `DATABASE_URL`, `MAX_RETRIES` |
| Files | kebab-case | `user.service.ts`, `create-user.dto.ts` |
| Folders | kebab-case | `src/users`, `src/common/filters` |
| Variables | camelCase | `userId`, `userData` |
| Enums | PascalCase | `UserRole`, `HttpStatus` |

---

## Path Aliases

Use path aliases for all imports:

```typescript
// ✅ Do This
import { UserService } from '@modules/users/users.service';
import { ValidationPipe } from '@common/pipes/validation.pipe';
import { Database } from '@database/database.module';
import { AppConfig } from '@config/app.config';

// ❌ Don't Do This
import { UserService } from '../../../../modules/users/users.service';
```

Aliases defined in `tsconfig.json`:
- `@/*` → `src/*`
- `@modules/*` → `src/modules/*`
- `@common/*` → `src/common/*`
- `@database/*` → `src/database/*`
- `@config/*` → `src/config/*`
- `@types/*` → `src/types/*`

---

## Module Architecture

### Feature Module Example (Users)

```
src/modules/users/
├── users.module.ts           # Module definition
├── users.controller.ts        # HTTP routes
├── users.service.ts           # Business logic
├── users.repository.ts        # Data access
├── users.spec.ts              # Unit tests
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   └── user.entity.ts
└── interfaces/
    └── user.interface.ts
```

### Module Declaration

```typescript
@Module({
  imports: [DatabaseModule], // Only import needed modules
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Export for other modules
})
export class UsersModule {}
```

### Controller Decorator Order

```typescript
@ApiTags('users')                        // Swagger grouping
@Controller('users')                     // Route
@UseGuards(JwtAuthGuard)                // Authentication
@UseInterceptors(LoggingInterceptor)     // Logging
@UsePipes(new ValidationPipe())          // Validation
export class UsersController {
  // Method handlers
}
```

### Service Template

```typescript
@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private emailService: EmailService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserDto> {
    // Validation
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email exists');
    }

    // Business logic
    const user = await this.repository.create(dto);

    // Side effects
    await this.emailService.sendWelcomeEmail(user.email);

    // Return DTO
    return this.mapToDto(user);
  }

  private mapToDto(user: User): UserDto {
    // Map entity to DTO
  }
}
```

### Repository Template

```typescript
@Injectable()
export class UserRepository {
  constructor(@Inject('DATABASE') private db: Database) {}

  async findAll(limit = 10, offset = 0): Promise<User[]> {
    return this.db.query.users.findMany({ limit, offset });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .returning();
    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where((users, { eq }) => eq(users.id, id))
      .returning();
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(users)
      .where((users, { eq }) => eq(users.id, id));
  }
}
```

---

## Type Safety Rules

1. **No implicit `any`**: TypeScript strict mode enforced
2. **Explicit return types**: All functions must have return types
3. **DTOs for I/O**: Use Data Transfer Objects for all I/O
4. **Entities separate**: Database entities differ from DTOs
5. **Interfaces as contracts**: Use interfaces for dependencies
6. **Error types**: Create custom HttpException classes

```typescript
// ✅ Good
async getUser(id: string): Promise<UserDto | null> {
  const user = await this.repository.findById(id);
  return user ? this.mapToDto(user) : null;
}

// ❌ Bad
async getUser(id: any): any {
  return this.repository.findById(id);
}
```

---

## Swagger/API Documentation

### Add Swagger to Endpoints

```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, type: UserDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    // Implementation
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserDto> {
    // Implementation
  }
}
```

### DTO with Swagger Decorators

```typescript
export class CreateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name',
  })
  @IsString()
  @MinLength(2)
  name: string;
}
```

---

## Database & Drizzle ORM

### Schema Location
`src/database/drizzle/schema.ts` — all tables defined here

### Migrations
```bash
pnpm run db:generate   # Create migration from schema changes
pnpm run db:migrate    # Run migrations against database
pnpm run db:studio     # Open Drizzle Studio UI
```

### Query Tips

```typescript
// ✅ Good: Parallel queries
const [users, count] = await Promise.all([
  db.query.users.findMany(),
  db.query.users.count(),
]);

// ✅ Good: Explicit where clauses
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.email, email),
});

// ❌ Bad: Sequential when should be parallel
const users = await db.query.users.findMany();
const count = await db.query.users.count();  // Unnecessary wait
```

---

## pnpm Scripts

```bash
pnpm install          # Install dependencies
pnpm run build        # Build for production
pnpm run start        # Start server
pnpm run start:dev    # Development with watch
pnpm run start:debug  # Debugging
pnpm run lint         # Lint and fix
pnpm run format       # Format with Prettier
pnpm run test         # Run unit tests
pnpm run test:watch   # Watch mode
pnpm run test:e2e     # E2E tests
pnpm run db:generate  # Generate migrations
pnpm run db:migrate   # Run migrations
pnpm run db:studio    # Open database UI
```

---

## Task Workflow

### 1. Plan First
- Read relevant documentation
- Search codebase if needed
- Document discovery in `/docs/findings.md`
- Outline implementation steps
- Consider impact on other modules

### 2. Verify Plan
- Check architectural consistency
- Confirm no side effects
- Review existing patterns
- Get approval for major changes

### 3. Implement
- Make focused, minimal changes
- Follow naming conventions
- Add TypeScript types throughout
- Include Swagger decorators
- Add unit tests for new logic

### 4. Document
- Update `/docs/findings.md` 
- Add inline comments for complex logic
- Update `/docs/api.md` if endpoints changed
- Update `/docs/database.md` if schema changed

### 5. Test
- Run unit tests: `pnpm run test`
- Run E2E tests: `pnpm run test:e2e`
- Check coverage: `pnpm run test:cov`
- Test in Swagger UI: `/api`

---

## Common Workflows

### Add New Feature Module

```bash
# 1. Create module structure
mkdir -p src/modules/feature-name/{dto,entities}

# 2. Use NestJS CLI
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name

# 3. Create Repository
# (Manual file: src/modules/feature-name/feature-name.repository.ts)

# 4. Create DTOs in dto/ folder
# (Manual files: src/modules/feature-name/dto/create-*.dto.ts)

# 5. Update AppModule to import FeatureModule

# 6. Generate database migration if needed
pnpm run db:generate
pnpm run db:migrate
```

### Query Database in Repository

```typescript
async findByFilter(email: string, isActive?: boolean): Promise<User[]> {
  const conditions = [];
  
  if (email) {
    conditions.push(eq(users.email, email));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  return this.db.query.users.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
}
```

### Add Authentication Guard

```typescript
@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {
  @Get()
  async get(@Request() req): Promise<any> {
    // User available via req.user
    console.log(req.user.id);
  }
}
```

---

## Search & Context Commands

### When to Check Findings
```
- Before implementing new feature
- When dealing with similar patterns
- If unsure about architectural decision
- To avoid duplicate work
```

### How to Update Findings
```
1. Document new discoveries in /docs/findings.md
2. Record architectural decisions (ADR-###)
3. Log features and their locations
4. Capture patterns and best practices
```

### Limiting Repository Search
- Use specific module paths: `src/modules/users/*`
- Search by file type: `**/*.service.ts`
- Search by pattern: `*repository.ts`
- Avoid full repo scans: be targeted

---

## Code Quality Standards

### Unit Tests
- Aim for >80% coverage
- Test business logic in services
- Mock repositories in tests
- Test error scenarios

### Type Coverage
- No `any` types allowed
- All function parameters typed
- All return types explicit
- Use interfaces for dependencies

### Documentation
- Swagger decorators on endpoints
- JSDoc for public methods
- Comments for complex logic
- Inline types, not comments for clarity

---

## Error Handling

### Use Custom Exceptions

```typescript
// Define custom exceptions
export class UserNotFoundException extends HttpException {
  constructor(id: string) {
    super(
      { message: `User ${id} not found`, error: 'Not Found' },
      HttpStatus.NOT_FOUND,
    );
  }
}

// Use in service
async getUser(id: string): Promise<UserDto> {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new UserNotFoundException(id);
  }
  return this.mapToDto(user);
}
```

### HTTP Status Codes
- **200** — Success (GET, PUT, PATCH)
- **201** — Created (POST)
- **204** — No Content (DELETE)
- **400** — Bad Request (validation)
- **401** — Unauthorized (no auth)
- **403** — Forbidden (insufficient permissions)
- **404** — Not Found
- **409** — Conflict (duplicate, constraint violation)
- **500** — Internal Server Error

---

## Testing Best Practices

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(UserRepository);
  });

  it('should find user by id', async () => {
    const expected = { id: '1', name: 'test' };
    jest.spyOn(repository, 'findById').mockResolvedValue(expected);

    const result = await service.getUser('1');

    expect(result).toEqual(expected);
  });
});
```

---

## Important Constraints

1. **pnpm exclusively** — Never npm or yarn
2. **TypeScript strict mode** — `noImplicitAny: true`
3. **NestJS patterns** — Use proper DI, modules, decorators
4. **Drizzle ORM** — Use schema, migrations in version control
5. **PostgreSQL** — Use appropriate column types
6. **No `.ts` files in import paths** — Always `from '@modules/users'`
7. **Separate DTOs from entities** — Different concerns
8. **Repository pattern** — All DB access through repositories
9. **Services as singletons** — NestJS provider pattern
10. **Swagger documentation** — All endpoints documented

---

## When Implementing Something New

### Checklist
- [ ] Read relevant doc files (`/docs/*`)
- [ ] Check `/docs/findings.md` for patterns
- [ ] Plan in comments or findings before coding
- [ ] Use proper naming conventions
- [ ] Add complete TypeScript types
- [ ] Add Swagger decorators
- [ ] Create unit tests
- [ ] Add try-catch/error handling
- [ ] Document discoveries in findings.md
- [ ] Run `pnpm run test` and `pnpm run lint`

---

## Documentation Files Reference

- **copilot-instructions.md** — AI agent coding guidelines
- **docs/project-structure.md** — Architecture & directory tree
- **docs/findings.md** — Discoveries & decisions
- **docs/api.md** — API endpoints & DTOs
- **docs/database.md** — Database schema & migrations
- **docs/patterns.md** — Code patterns & best practices
- **README.md** — Getting started guide

---

## Contact

For questions about architecture or patterns, check:
1. `/docs/` folder (specific guidance)
2. `copilot-instructions.md` (general rules)
3. Code examples in `src/` (existing patterns)

---

**This project prioritizes clarity, safety, and simplicity.**  
**Make code that's easy to understand, test, and maintain.**