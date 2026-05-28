# Redis & BullMQ Setup Guide

This guide covers running **Redis + BullBoard only** for local development without the full NestJS app.

## Quick Start (Redis + BullBoard Only)

```bash
# Start Redis and BullBoard
docker compose up redis redis-bullboard

# Access BullBoard dashboard
# URL: http://localhost:3010
# Login: admin / admin123

# Test Redis connection from host
redis-cli -p 6379 -a redis_dev_password ping
# Expected: PONG
```

## Full Stack (APIs + PostgreSQL + Redis + BullBoard)

```bash
# Run with full infrastructure
docker compose --profile apis --profile db up

# This starts:
# - NestJS API on http://localhost:3000
# - PostgreSQL on localhost:5432
# - Redis on localhost:6379
# - BullBoard on http://localhost:3010
```

## Docker Compose Profile Breakdown

| Profile | Services | Use Case |
|---------|----------|----------|
| *(default)* | redis, redis-bullboard | Local dev: queues only |
| `apis` | + apis (NestJS) | Full API development |
| `db` | + postgres | Database required |

## Configuration

### Environment Variables (`.env`)

```bash
# Redis
REDIS_HOST=redis              # Container network hostname
REDIS_PORT=6379              # Default port
REDIS_PASSWORD=redis_dev_password  # Set strong password in production!
REDIS_URL=redis://:redis_dev_password@redis:6379

# BullMQ
BULLMQ_PREFIX=Queue          # Queue name prefix
BULLBOARD_PORT=3010          # BullBoard web UI port
BULLBOARD_USER_LOGIN=admin    # BullBoard dashboard user
BULLBOARD_USER_PASSWORD=admin123  # Change in production!

# Only needed if running full stack (--profile apis --profile db)
DATABASE_URL=postgresql://ciap:ciap_dev_password@postgres:5432/ciap
APP_PORT=3000
NODE_ENV=development
```

## Network Access

Since `internal: false`, containers are accessible from your host machine:

| Service | Host Access |
|---------|------------|
| Redis | `localhost:6379` |
| BullBoard | `http://localhost:3010` |
| PostgreSQL | `localhost:5432` |
| API | `http://localhost:3000` |

## Troubleshooting

### Redis Connection Failed
```bash
# Test from host
redis-cli -p 6379 -a redis_dev_password PING
# Expected: PONG

# Or check container logs
docker compose logs redis
```

### BullBoard Won't Start
```bash
# Verify Redis is healthy
docker compose ps redis

# Check BullBoard logs
docker compose logs redis-bullboard

# Ensure REDIS_PASSWORD in .env matches redis service
```

### Clean Up Everything
```bash
# Stop and remove containers
docker compose down

# Remove volumes (WARNING: deletes Redis data!)
docker compose down -v
```

## Dockerfile Notes

- **db:generate is now error-tolerant**: If the database isn't available during image build, the app will still start
- **start:dev command**: Watches file changes and auto-reloads
- For production, change `CMD` to `node dist/main` and run `pnpm build` first

## Health Checks

All services have health checks:

```bash
# View health status
docker compose ps

# Or watch in real-time
watch 'docker compose ps'
```

Full health check will pass when:
- Redis responds to `redis-cli PING`
- BullBoard HTTP endpoint returns 200
- (API and PostgreSQL only when running full stack)
