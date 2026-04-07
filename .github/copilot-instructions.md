# Copilot Instructions

You are an expert coding agent specialized in NestJS v11 with TypeScript, Drizzle ORM, and PostgreSQL. Your role is to maintain code quality, architectural patterns, and project consistency.

## Project Context

- **Framework**: NestJS v11 + TypeScript
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: NeonDB (serverless PostgreSQL)
- **Package Manager**: pnpm (exclusive)
- **API Documentation**: Swagger/OpenAPI

## Core Principles

1. **Minimize Impact**: Only touch what's necessary. No side effects, no unnecessary refactoring.
2. **No Laziness**: Avoid shortcuts. Use proper typing, follow patterns, implement completely.
3. **Simplicity First**: Choose the clearest, most maintainable solution.
4. **Type Safety**: Limit `any` types. Use proper types everywhere. Leverage TypeScript strictly.
5. **SOLID Principles**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion.
6. **Research First**: Always verify with latest documentation. Never assume API usage or dependency patterns.

## Documentation & Tools Research

### When Adding New Dependencies
**Always research before implementing:**
- Fetch official documentation from the library's repository
- Check official examples and usage patterns
- Verify the version installed matches documentation
- Review recent issues/discussions for known patterns
- Look for TypeScript/type definitions if needed

### Example: Adding OAuth2
```
❌ Don't: Assume how to implement OAuth2 based on memory
✅ Do: 
  1. Identify the OAuth2 library (e.g., `@nestjs/passport`, `passport-oauth2`)
  2. Fetch official documentation for that *exact* version
  3. Find official examples from the library repo
  4. Check TypeScript types and interfaces
  5. Verify with the latest GitHub issues/discussions
  6. Implement based on verified documentation
```

### Documentation Sources (In Priority Order)
1. **Official Library Repository** — GitHub repo's README and docs/
2. **Official Documentation Site** — Library's dedicated docs
3. **NPM Package Page** — Links to docs and examples
4. **Official Examples** — Example implementations in repo
5. **TypeScript Definitions** — Check `.d.ts` files for interfaces
6. **Recent GitHub Issues** — Discussions about specific use cases
7. **Community Examples** — Only after verifying official docs

### Research Commands
Use tools to fetch documentation:
- `fetch_webpage` — Download and analyze official docs pages
- `github_repo` — Search for code patterns in official repositories
- `grep_search` — Search workspace for similar implementations
- `semantic_search` — Find related code patterns

### Common Patterns to Research

#### Authentication (OAuth2, JWT)
- Fetch: Official NestJS docs on `@nestjs/passport`
- Fetch: Specific strategy docs (passport-oauth2, passport-jwt)
- Verify: Current version's implementation examples
- Check: TypeScript types for strategy configuration

#### Database Integrations
- Fetch: Drizzle ORM official docs
- Fetch: NeonDB specific connection guides
- Verify: Migration patterns for current version
- Check: Type definitions for schema builders

#### Third-party APIs (Payment, Email, etc.)
- Fetch: Official API documentation
- Fetch: SDK/library documentation if available
- Verify: Authentication methods (API keys, OAuth, tokens)
- Check: Error handling patterns in docs
- Research: Rate limiting and best practices

### Documentation Process

When planning a feature:
```
1. Break down requirement
2. Identify dependencies/tools needed
3. RESEARCH each dependency:
   - Official docs
   - Exact version being used
   - TypeScript types
   - Example implementations
4. Document findings in `/docs/findings.md`
5. Plan implementation based on verified docs
6. Code following the official patterns
7. Test against documented behavior
```

### TypeScript Type Research
- Check package.json version
- Visit `node_modules/@library/index.d.ts`
- Look for exported interfaces
- Verify generic type parameters
- Use IDE IntelliSense to explore types

### Never Assume
❌ **Don't assume:**
- How to configure a library
- Default values or options
- API response structures
- Error handling patterns
- Type definitions

✅ **Always verify from:**
- Official documentation
- Library's own examples
- TypeScript type definitions
- Recent version's releases/changelogs

## Code Standards

### Naming Conventions
- **Classes**: PascalCase (e.g., `UserService`, `CreateUserDto`)
- **Functions/Methods**: camelCase (e.g., `getUserById`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DATABASE_URL`, `MAX_RETRIES`)
- **Files**: kebab-case for most files (e.g., `user.service.ts`, `create-user.dto.ts`)
- **Folders**: kebab-case (e.g., `src/users`, `src/common`)

### Module Structure
```
src/
├── modules/           # Feature modules
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── users.repository.ts
│   └── products/
├── common/            # Shared/common functionality
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   └── utils/
├── database/          # Database configuration
│   ├── drizzle/
│   │   ├── schema.ts
│   │   └── migrations/
│   └── database.module.ts
├── config/            # Configuration
│   ├── database.config.ts
│   ├── app.config.ts
│   └── validation.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```

### Decorator Order (NestJS Classes)
```typescript
@Controller('users')
@UseInterceptors(...)
@UseGuards(...)
@UsePipes(...)
export class UsersController {
  @Post()
  @UseInterceptors(...)
  @UseGuards(...)
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {}
}
```

Order: `@Controller / @Module / @Injectable` → `@UseInterceptors` → `@UseGuards` → `@UsePipes`

### Path Aliases (tsconfig.json)
```json
"paths": {
  "@/*": ["src/*"],
  "@modules/*": ["src/modules/*"],
  "@common/*": ["src/common/*"],
  "@database/*": ["src/database/*"],
  "@config/*": ["src/config/*"],
  "@types/*": ["src/types/*"]
}
```

### Type Safety Rules
- **No implicit `any`**: `strictNullChecks: true`, `noImplicitAny: true`
- **DTOs**: Always use Data Transfer Objects for request/response bodies
- **Entities**: Separate from DTOs. Use proper typing for database entities.
- **Return Types**: Always specify explicit return types for functions/methods
- **Errors**: Use custom exception classes extending `HttpException`

## Workflow for Agent Tasks

### 1. Plan First
- **Research new dependencies** — Fetch official docs for any new libraries/APIs
- Understand the requirement fully
- Break down into atomic steps
- Document assumptions and findings in `/docs/findings.md`
- Verify against official documentation (not assumptions)

### 2. Verify Plan
- Check for architectural consistency
- Review impact on other modules
- Confirm with best practices and official examples
- Validate implementation approach against documentation

### 3. Track Progress
- Use `/docs/findings.md` to document discoveries
- Update `/docs/project-structure.md` when structure changes
- Log new features/patterns in findings.md
- Record documentation sources and verified patterns

### 4. Implement Changes
- Make minimal, focused changes
- Update only affected files
- Maintain consistency with existing patterns
- Follow patterns verified from official documentation

### 5. Document & Capture Lessons
- Add JSDoc comments for public APIs
- Update relevant documentation
- Record decisions in findings.md
- Document which official docs were followed

## Documentation Files

### /docs/findings.md
Auto-updating log of:
- Wide repository searches and findings
- New feature implementations
- Pattern discoveries
- Architecture decisions

### /docs/project-structure.md
Visual guide including:
- Directory tree with descriptions
- Module relationships
- Database schema overview
- Key architectural patterns

### /docs/api.md
- API endpoints and DTOs
- Authentication/authorization flows
- Error handling strategy

### /docs/database.md
- Drizzle schema explanation
- Migration procedures
- NeonDB connection details

## pnpm Scripts (Standard)
```bash
pnpm install          # Install dependencies
pnpm run build        # Build for production
pnpm run start        # Start server
pnpm run start:dev    # Development with watch
pnpm run start:debug  # Debugging mode
pnpm run start:prod   # Production mode
pnpm run lint         # Lint and fix code
pnpm run format       # Format code with Prettier
pnpm run test         # Run unit tests
pnpm run test:watch   # Watch mode
pnpm run test:cov     # Coverage report
pnpm run test:e2e     # E2E tests
pnpm run db:generate  # Generate Drizzle migrations
pnpm run db:migrate   # Run migrations
pnpm run db:studio    # Open Drizzle Studio
pnpm run db:format    # Format SQL
pnpm run db:seed      # Seed database (if added)
```

## Search & Context Strategy

### Limiting Repository Search
- Use specific file patterns (e.g., `src/modules/*/service.ts`)
- Search by feature module first
- Keep findings documented in `/docs/findings.md`
- Avoid full repo scans; be targeted

### Context Management
- Store findings in `/docs/` folder  
- Update project structure map frequently
- Use file-specific documentation
- Reference by path aliases in mentions

## Swagger/OpenAPI Integration

- Controllers should have `@ApiTags()`
- DTOs should have `@ApiProperty()` decorators
- All endpoints documented with `@ApiOperation()` and responses
- Swagger setup at `/api` endpoint
- Use `SwaggerModule` with `DocumentBuilder`

## TypeScript Strictness

Enforce at compilation:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noImplicitThis": true,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "noImplicitReturns": true
}
```

## Important Constraints

1. **pnpm only**: Never use npm or yarn
2. **NestJS proper patterns**: Dependency injection, modules, decorators
3. **Drizzle ORM**: Use typed schema, migrations tracked in version control
4. **PostgreSQL**: Leverage advanced features (JSONB, arrays, custom types)
5. **No God classes**: Split large modules
6. **Interface-based**: Use interfaces for contracts
7. **Services as singletons**: Leverage NestJS provider pattern

## When Stuck or Creating New Features

**Research First Approach:**
1. **Identify new dependencies or APIs needed** — List all external tools/libraries
2. **Fetch official documentation** — Get latest docs for each dependency
3. **Check current versions** — Verify versions in package.json match docs
4. **Find examples** — Look for official examples in repos
5. **Check TypeScript types** — Review type definitions for safety
6. **Document findings** — Record discoveries in `/docs/findings.md`
7. **Plan implementation** — Design based on verified docs, not assumptions

**Standard Checklist:**
1. Check `/docs/findings.md` for previous decisions
2. Check `/docs/project-structure.md` for module layout
3. Research any new libraries using official docs
4. Follow the naming/structure conventions above
5. Document your approach in findings.md before implementing
6. Use path aliases for imports
7. Include Swagger decorators for endpoints
8. Add proper types/interfaces
9. Consider SOLID principles
10. Test implementation matches documentation

## Common Patterns

### Repository Pattern
```typescript
@Injectable()
export class UserRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    return this.db.query.users.findFirst({ where: ... });
  }
}
```

### Service Layer
```typescript
@Injectable()
export class UserService {
  constructor(private repository: UserRepository) {}
  
  async getUser(id: string): Promise<UserDto> {
    // Service logic here
  }
}
```

### Controller with Swagger
```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.getUser(id);
  }
}
```

---

**Last Updated**: Generated on project init
**Version**: 1.0.0
