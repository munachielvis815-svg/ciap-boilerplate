# YouTube Metrics Ingestion & Analytics - Agent Instructions

**Scope**: Guides work on YouTube content intelligence, analytics normalization, caching, and job queueing.

## Context

The platform ingests YouTube channel metrics, video engagement, and daily analytics to support:
- Content intelligence (video performance, engagement ratios)
- Growth tracking (subscriber velocity, view trends)
- ML scoring and recommendations

## Data Flow

```
YouTube API (raw nested data)
    ↓
SocialsService (fetch + expand metrics)
    ↓
YoutubeNormalizationService (validate + convert types)
    ↓
YoutubeRepository (persist to DB)
    ↓
YoutubeCache (Redis, TTL 1-3h)
    ↓
BullMQ Job (queue for ML processor)
```

## Schema & Types

### Tables

- **youtube_channels**: Channel baseline, subscriber count, total views, upload playlist
- **youtube_videos**: Video engagement (likes, comments, duration), published date, view count
- **youtube_daily_analytics**: Time-series metrics (views, watch time, avg duration, subscriber velocity)

### Type Safety

- BigInt: `totalViewCount`, `subscriberCount` (YouTube counts exceed JavaScript safety limit)
- Integer: video counts, engagement metrics, durations
- Date: ISO strings from API → Date objects at normalization
- Nullable: Optional fields (description, thumbnail, duration)

## Normalization Standards

### String → Number Conversion

All YouTube statistics are returned as strings; convert at normalization layer:

```typescript
// ❌ Bad: pass string to DB/cache
const viewCount = metrics.statistics?.viewCount; // "123456"

// ✅ Good: normalize to number
const viewCount = parseInt(metrics.statistics?.viewCount || '0', 10);
if (!Number.isFinite(viewCount) || viewCount < 0) {
  viewCount = 0; // fallback to 0 for invalid values
}
```

### ISO8601 Duration Parsing

YouTube API returns video duration as ISO8601 string (e.g., `PT5M30S`):

```typescript
// ✅ Parse to seconds at normalization
const durationSeconds = parseIso8601Duration(duration); // PT5M30S → 330
```

### Engagement Ratios (for ML)

Calculate engagement metrics from normalized data:

```typescript
// ✅ Cache these alongside normalized records for ML access
const engagementRatio = likeCount / viewCount; // avoid division by zero
const commentEngagement = commentCount / estimatedMinutesWatched;
```

## Caching Strategy

### Module Architecture

**Files**: `src/modules/cache/`
- `redis-cache.service.ts` - Generic Redis cache service (reusable by all feature modules)
- `youtube-cache.service.ts` - YouTube-specific cache with domain-aware key patterns + invalidation logic
- `cache.module.ts` - NestJS module provider exporting both services

**Integration**:
- `CacheModule` imported globally in `AppModule` (available to all modules)
- YouTube ingestion module imports `CacheModule` to access `YoutubeCacheService`
- Other modules (TikTok, Instagram, etc.) can use generic `RedisCacheService` without duplication

**Do not create module-specific cache services**; extend `RedisCacheService like YouTube does:

```typescript
// ✅ Good: YouTube-specific operations extend generic cache
@Injectable()
export class YoutubeCacheService {
  constructor(private readonly cache: RedisCacheService) {}
  
  async setChannel(channel: YoutubeChannel): Promise<void> {
    const key = `youtube:channel:${channel.youtubeChannelId}`;
    await this.cache.set(key, channel, this.ttlHours);
  }
}

// ❌ Bad: Create new Redis client instead of using generic service
const redis = new Redis(REDIS_URL);
await redis.set('key', value);
```

### What to Cache

Cache **normalized data**, not raw API responses:
- Smaller footprint (converted types, no nested objects)
- ML-ready format (ready for scoring)
- Consistent structure across refreshes

### TTL Guidelines

- **Channel baseline**: 2-3 hours (subscriber count changes slowly)
- **Video metrics**: 2-3 hours (engagement stats update frequently)
- **Daily analytics**: 24 hours (historical, stable)
- Configured via `YOUTUBE_CACHE_TTL_HOURS` env var (default: 2h)

### Cache Service API

```typescript
// Store normalized channel
await this.cache.setChannel(normalizedChannel);

// Retrieve cached channel
const channel = await this.cache.getChannel(youtubeChannelId);

// Store videos (individual keys per video)
await this.cache.setVideos(youtubeChannelId, videos);

// Retrieve single video or all by pattern
const video = await this.cache.getVideo(youtubeChannelId, videoId);
const allVideos = await this.cache.getChannelVideos(youtubeChannelId);

// Store analytics (single key, entire dataset)
await this.cache.setAnalytics(youtubeChannelId, analyticsData);

// Retrieve analytics
const analytics = await this.cache.getAnalytics(youtubeChannelId);

// Invalidate cache (call after successful persist)
await this.cache.invalidateChannel(youtubeChannelId);

// Health check
const isHealthy = await this.cache.healthCheck();
```

### Key Naming Pattern

```
youtube:channel:{youtubeChannelId}
youtube:video:{youtubeChannelId}:{youtubeVideoId}
youtube:analytics:{youtubeChannelId}
```

### Invalidation

Invalidate **immediately after successful persist** to prevent stale cache:

```typescript
// In ingestion orchestration:
try {
  await this.repository.persistAll(normalized);
  await this.cache.invalidateChannel(channelId); // <-- Critical
  await this.jobQueue.addJob(...);
} catch (error) {
  // Repo fails: don't invalidate, stale cache is safer than double-syncing
  throw error;
}
```

### Connection & Lifecycle

- Redis connection established at service init (via `REDIS_URL`)
- Health check available: `cache.healthCheck()` returns boolean
- Graceful shutdown: `onModuleDestroy()` closes connection on app stop
- Non-critical failures: Cache errors are logged but don't break ingestion flow

### Caching Strategy

## Job Queueing (BullMQ)

### Queue Config

| Setting | Value | Rationale |
|---------|-------|-----------|
| Queue Name | `youtube-metrics` | Single queue for all YouTube jobs |
| Max Retries | 3 | Retry transient failures (API rate limit, network) |
| Backoff | Exponential (3s → 9s → 27s) | Avoid hammering on retry |
| DLQ Threshold | Failed after 3 retries | Move to `youtube-metrics-dlq` |
| Queue Backpressure | Pause enqueue if queue depth > 100 | Prevent job explosion during heavy load |

### Queue Module Structure

**Files**: `src/modules/queue/`
- `queue-config.service.ts` - Centralized env-driven config (no hardcoding)
- `queue.service.ts` - Job enqueue, DLQ routing, backpressure, monitoring
- `queue.module.ts` - NestJS integration

**All config from environment**:
```bash
REDIS_URL=redis://:password@localhost:6379
BULLMQ_PREFIX=Queue                        # Default queue name prefix
BULLMQ_MAX_RETRIES=3                       # Total attempts = 4 (1 initial + 3 retries)
BULLMQ_BACKOFF_DELAY_MS=3000               # Exponential backoff: 3s → 9s → 27s
BULLMQ_QUEUE_BACKPRESSURE_LIMIT=100        # Warn/pause when queue depth > 100
```

### Job Payload

```typescript
type YoutubeMetricsJobPayload = {
  provider: 'google';
  userId: number;
  tenantId: number;
  channelId?: string;        // From normalized channel (optional, for context)
  days: number;
  maxVideos: number;
  requestedAt: string;       // ISO timestamp
  cacheKey?: string;         // Hint: if data was cached
};
```

### Adding Jobs to Queue

```typescript
// Inject QueueService
constructor(private readonly queue: QueueService) {}

// Enqueue job (after successful persist + cache)
const jobId = await this.queue.addYoutubeMetricsJob(
  {
    provider: 'google',
    userId: actor.id,
    tenantId: actor.tenantId,
    days: 30,
    maxVideos: 10,
    requestedAt: new Date().toISOString(),
  },
  'user-requested-sync' // optional reason for logging
);

// Job is now in queue, will be retried if it fails
// After 3 failed retries, moves to DLQ: youtube-metrics-dlq
```

### Monitoring Queue Health

```typescript
// Get queue statistics
const stats = await this.queue.getQueueStats('youtube-metrics');
// {
//   queue: 'youtube-metrics',
//   waiting: 5,
//   active: 2,
//   paused: 0,
//   delayed: 0,
//   failed: 0,
//   completed: 1523,
//   dlq: {
//     name: 'youtube-metrics-dlq',
//     count: 3
//   }
// }
```

### DLQ Handling

Jobs move to DLQ when:
- **youtube-rate-limit**: YouTube API returned 429
- **invalid-channel-data**: Channel ID invalid or channel deleted
- **ml-processor-timeout**: Scoring took > timeout threshold
- **database-unavailable**: Persistent DB error after retries
- **unrecoverable-error**: Processor hit unhandleable exception

**Inspection**:
```typescript
// Processor code (next task) will move failed jobs to DLQ:
try {
  await this.processor.processYoutubeMetrics(job);
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    await this.queue.moveJobToDlq(job.id, 'youtube-metrics', 'youtube-rate-limit', error.message);
  }
  // ... other error types
}

// DLQ jobs stay in 'youtube-metrics-dlq' queue for 7 days
// Query DLQ for debugging: await dlq.getJobs(['waiting', 'completed', 'failed']);
```

### Backpressure Strategy

When queue depth > `BULLMQ_QUEUE_BACKPRESSURE_LIMIT` (default 100):
- **Current behavior**: Log warning, allow job enqueue
- **Alternative**: Reject with error (opt-in via config)

```typescript
// In queue.service.ts addYoutubeMetricsJob():
if (queueDepth > this.queueConfig.getQueueBackpressureLimit()) {
  this.logger.warn(`Queue backpressure: ${queueDepth} jobs pending`);
  // Option 1: Allow (current)
  // Option 2: Throw error (uncomment lines in service)
}
```

### Retry & Backoff Mechanics

**Attempt timeline**:
1. Initial attempt: 0ms
2. Retry #1: 3s (3 * delay)
3. Retry #2: 9s (3 * 3 * delay)
4. Retry #3: 27s (3 * 3 * 3 * delay)
5. After attempt 4 fails: move to DLQ

**Exponential backoff prevents**:
- Rate limiting (gradual retry spacing)
- Cascading failures (time for service to recover)
- Queue explosion (retries don't re-fill queue immediately)

### Graceful Shutdown

```typescript
// In AppModule or main.ts, NestJS calls onModuleDestroy automatically
// QueueService.onModuleDestroy():
// 1. Pauses all queues (stops accepting new jobs)
// 2. Allows in-flight jobs to complete
// 3. Closes all connections gracefully
```

## Job Processor (BullMQ Worker)

### Processor Architecture

**Files**: `src/modules/ingestion/youtube/`
- `youtube-metrics.processor.ts` - Job handler logic (ML scoring, result storage)
- `youtube-metrics.repository.ts` - Persistence layer for ML score upserts
- `youtube-queue.worker.ts` - BullMQ worker lifecycle management (NestJS integration)

### Processor Handler Pattern

The processor receives a `BullJob<YoutubeMetricsJobPayload>` and should:
1. Extract payload data
2. Fetch required data (channels, videos, other context)
3. Run computation (ML scoring, transformations)
4. Persist results to database
5. Throw on error (BullMQ will retry/DLQ)

```typescript
@Injectable()
export class YoutubeMetricsProcessor {
  async process(job: BullJob<YoutubeMetricsJobPayload, void>): Promise<void> {
    const { userId, channelId, days, maxVideos } = job.data;
    
    try {
      // 1. Fetch context
      const channel = await this.youtubeRepository.getChannelByYoutubeId(channelId);
      const videos = await this.youtubeRepository.getRecentVideos(channel.id, maxVideos);
      
      // 2. Compute scores
      const scores = videos.map(v => ({
        videoId: v.id,
        engagementScore: this.computeEngagementScore(v),
        growthScore: this.computeGrowthScore(v, videos),
        recommendationScore: 0.6 * engagementScore + 0.4 * growthScore,
        jobId: job.id,
      }));
      
      // 3. Persist results
      await this.metricsRepository.upsertMlScores(scores);
      
      this.logger.log(`[Job ${job.id}] Completed: ${scores.length} videos scored`);
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Failed: ${error.message}`);
      throw error; // Trigger BullMQ retry/DLQ
    }
  }
  
  private computeEngagementScore(video: YoutubeVideo): number {
    // Formula: (likes + comments) / views, capped at 100
    const views = video.viewCount || 1;
    return Math.min(((video.likeCount || 0) + (video.commentCount || 0)) / views * 100, 100);
  }
}
```

### ML Scores Schema

Add to database schema when implementing scoring:

```typescript
export const youtubeMlScores = pgTable('youtube_ml_scores', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').references(() => youtubeVideos.id, { onDelete: 'cascade' }),
  engagementScore: real('engagement_score').notNull(),    // 0-100
  growthScore: real('growth_score').notNull(),            // 0-100
  recommendationScore: real('recommendation_score').notNull(), // 0-100
  performanceRank: integer('performance_rank'),           // Rank within channel
  scoredAt: timestamp('scored_at').notNull().defaultNow(),
  jobId: text('job_id'),                                  // BullMQ job ID for traceability
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### Worker Registration

Do not manually register workers; use NestJS service:

```typescript
// ✅ Good: NestJS service manages worker lifecycle
@Injectable()
export class YoutubeQueueWorker implements OnModuleInit, OnModuleDestroy {
  private worker: BullWorker | null = null;
  
  async onModuleInit() {
    const config = this.queueConfig.getBaseConfig();
    this.worker = new BullWorker('youtube-metrics', (job) => this.processor.process(job), config);
    this.logger.log('Worker registered for youtube-metrics');
  }
  
  async onModuleDestroy() {
    await this.worker?.close();
  }
}

// ❌ Bad: Manual worker outside lifecycle control
const worker = new BullWorker('youtube-metrics', handler, config);
```

### Error Handling & DLQ

The processor should throw on error; BullMQ automatically retries and routes to DLQ:

```typescript
// ✅ Good: Throw error for IQ retry logic
try {
  const result = await this.externalMlService.score(video);
} catch (error) {
  this.logger.error(`ML scoring failed for video ${video.id}: ${error.message}`);
  throw error; // BullMQ will retry up to 3x, then move to DLQ
}

// ❌ Bad: Swallow error, job appears successful
try {
  const result = await this.externalMlService.score(video);
} catch (error) {
  this.logger.error(`ML scoring failed: ${error.message}`);
  return; // Job marked complete even though scoring failed!
}
```

### Performance Tuning

**Worker Concurrency**:
```bash
BULLMQ_WORKER_CONCURRENCY=2  # Default: 2 jobs processed in parallel
```

Increase for CPU-bound scoring, decrease if external API rate-limited.

**Job Timeouts**:
```bash
BULLMQ_JOB_TIMEOUT_MS=30000  # Kill job if running > 30 seconds
```

### Testing the Processor

```typescript
// Mock the processor in tests
const mockProcessor = {
  process: jest.fn().mockResolvedValue(undefined),
};

const mockJob: BullJob = {
  id: 'test-job',
  data: { userId: 1, tenantId: 1, channels: 'UC123' },
  attempts: 1,
  // ... other BullJob properties
};

await mockProcessor.process(mockJob);
expect(mockProcessor.process).toHaveBeenCalledWith(mockJob);
```

## Job Queueing (BullMQ)

## Environment Variables

| Variable | Example | Used By | Notes |
|----------|---------|---------|-------|
| `REDIS_URL` | `redis://:password@localhost:6379` | Cache + Queue | Required; must be valid URI |
| `YOUTUBE_CACHE_TTL_HOURS` | `2` | Cache service | Default: 2h; controls expires on cached data |
| `BULLMQ_PREFIX` | `Queue` | Queue service | Queue name prefix in Redis keys |
| `BULLMQ_MAX_RETRIES` | `3` | Queue config | Total attempts = 4; each fail triggers exponential backoff |
| `BULLMQ_BACKOFF_DELAY_MS` | `3000` | Queue config | Initial backoff delay; multiplied exponentially per retry |
| `BULLMQ_QUEUE_BACKPRESSURE_LIMIT` | `100` | Queue service | Max queue depth before warning; pause enqueue if exceeded |
| `BULLMQ_WORKER_CONCURRENCY` | `2` | Worker | Jobs processed in parallel; tune for CPU/IO bound work |

**Do not hardcode these**; always read from `ConfigService`:
```typescript
const ttl = this.configService.get<number>('YOUTUBE_CACHE_TTL_HOURS') ?? 2;
```

## Patterns

### Repository Layer

```typescript
@Injectable()
export class YoutubeRepository {
  async createChannel(data: NewYoutubeChannel): Promise<YoutubeChannel> {
    return this.db.insert(youtubeChannels).values(data).returning().then(r => r[0]);
  }

  async upsertVideoMetrics(videos: NewYoutubeVideo[]): Promise<YoutubeVideo[]> {
    return this.db.insert(youtubeVideos).values(videos)
      .onConflictDoUpdate({
        target: youtubeVideos.youtubeVideoId,
        set: { /* updatable fields */ }
      }).returning();
  }
}
```

### Queue Service Pattern

**Do not instantiate BullQueue directly**; use `QueueService`:

```typescript
// ✅ Good: Injected service handles config + lifecycle
constructor(private readonly queueService: QueueService) {}

async enqueueJob() {
  const jobId = await this.queueService.addYoutubeMetricsJob({
    provider: 'google',
    userId: 1,
    tenantId: 1,
    days: 30,
    maxVideos: 10,
    requestedAt: new Date().toISOString(),
  });
}

// ❌ Bad: Hardcoded queue/retry config
const queue = new BullQueue('youtube-metrics', { ... });
```

**Error handling pattern**:

```typescript
try {
  await this.queueService.addYoutubeMetricsJob(payload);
} catch (error) {
  // Queue service logs errors; inspect queue stats or check Redis directly
  this.logger.error('Failed to enqueue job', error);
  // Consider: should we fallback to retry in HTTP response, or 202 (accepted)?
}
```

### Service Orchestration

```typescript
@Injectable()
export class YoutubeIngestService {
  constructor(
    private readonly socials: SocialsService,
    private readonly normalization: YoutubeNormalizationService,
    private readonly repository: YoutubeRepository,
    private readonly cache: YoutubeCacheService,
    private readonly queue: QueueService,
  ) {}

  async syncYoutubeMetrics(actor: RequestUser, query: YoutubeMetricsQueryDto) {
    // 1. Fetch raw data from YouTube API
    const raw = await this.socials.getYoutubeMetrics(actor, query);
    
    // 2. Normalize (string → int, duration parsing, etc.)
    const normalized = {
      channel: this.normalization.normalizeChannel(raw.channel.id, raw.channel, actor.id),
      videos: this.normalization.normalizeVideos(raw.videos),
      analytics: this.normalization.normalizeDailyAnalytics(raw.analytics.rows),
    };
    
    // 3. Persist to DB (transaction)
    const persisted = await this.repository.upsertAll(normalized);
    
    // 4. Cache normalized data (non-critical; don't fail if cache errors)
    await this.cache.setChannel(persisted.channel);
    await this.cache.setVideos(actor.id, persisted.videos);
    await this.cache.setAnalytics(actor.id, persisted.analytics);
    
    // 5. Invalidate stale cache
    await this.cache.invalidateChannel(normalized.channel.youtubeChannelId);
    
    // 6. Enqueue ML job (non-critical; don't fail if queue errors)
    try {
      await this.queue.addYoutubeMetricsJob({
        provider: 'google',
        userId: actor.id,
        tenantId: actor.tenantId,
        channelId: normalized.channel.youtubeChannelId,
        days: query.days ?? 30,
        maxVideos: query.maxVideos ?? 10,
        requestedAt: new Date().toISOString(),
      }, 'user-requested-sync');
    } catch (queueError) {
      this.logger.error('Failed to queue ML job; user data is persisted but scoring deferred', queueError);
      // Return 200 with warning, or 202 (Accepted) to indicate job queued
    }
    
    return {
      channel: persisted.channel,
      videosCount: persisted.videos.length,
      analyticsCount: persisted.analytics.length,
      jobId: jobId || null,
    };
  }
}
```

## Patterns

## Testing

### Unit Tests

- Normalization service: test string→int conversion, ISO8601 parsing, edge cases (null, 0, overflow)
- Cache service: test set/get, TTL expiry, invalidation
- Job queueing: test retry logic, DLQ routing, backoff delay

### E2E Tests

- API → normalization → DB → cache → job enqueue
- Verify job can be retrieved from queue and processed

## Documentation

- Update `docs/api.md` for YouTube metrics endpoints (request/response examples)
- Update `agent-docs/findings.md` with normalization patterns and performance lessons
- Add migration notes if schema changes

## Common Pitfalls

1. **Forgetting to normalize**: Passing raw YouTube API response to DB/cache causes type mismatches
2. **String numbers in cache**: Cache string values → ML expects numbers; always parse at normalization
3. **Division by zero**: Engagement ratios without null checks crash ML pipeline
4. **Missing DLQ logging**: Jobs disappear into DLQ without visibility; always log failure reason
5. **Hardcoded API keys**: Config should be env-driven; never embed secrets in code

## Checklist for Features Using This Infrastructure

- [ ] Raw API response types match YouTube API docs
- [ ] Normalization handles all possible null/missing fields
- [ ] Normalized types match database schema exactly
- [ ] Cache TTL is documented and appropriate
- [ ] Job payload has enough context for processor
- [ ] DLQ has clear failure reason + logging
- [ ] Backoff strategy tested under queue load
- [ ] Env variables documented in `.env.example`
- [ ] Tests cover happy path + edge cases
