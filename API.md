# API Reference

This document reflects the backend controllers and DTOs as of 2026-05-19.

## Base URLs

- Local API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs

## Auth Notes

- Login, signup, OAuth callbacks, and refresh set httpOnly cookies:
  - ciap_access (access token)
  - ciap_refresh (refresh token)
- Protected endpoints use JWT access tokens.
- Current JWT strategy extracts access tokens from the Authorization header only:

```http
Authorization: Bearer <access_token>
```

## Endpoints

### App

- GET /
  - Auth: public
  - Response:

```json
{
  "name": "CIAP",
  "version": "0.0.1",
  "description": "NestJS API with Drizzle ORM and PostgreSQL",
  "environment": "development",
  "features": [
    "RESTful API",
    "Swagger/OpenAPI Documentation",
    "PostgreSQL Database",
    "Drizzle ORM",
    "JWT Authentication (ready)"
  ]
}
```

### Health

- GET /health
  - Auth: public
  - Response: ApiHealthDto

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1234.56,
  "environment": "development",
  "version": "1.0.0"
}
```

- GET /health/db
  - Auth: public
  - Response: DatabaseHealthDto

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Database connection successful",
  "database": "connected",
  "error": null
}
```

- GET /health/cache
  - Auth: public
  - Response: CacheHealthDto

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Redis cache connection successful",
  "cache": "connected",
  "error": null
}
```

- GET /health/ready
  - Auth: public
  - Response: ReadinessHealthDto

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Service is ready",
  "ready": true
}
```

### Auth

- POST /auth/signup
  - Auth: public
  - Body: SignupDto

```json
{
  "email": "new.user@example.com",
  "name": "New User",
  "password": "StrongPassword123!",
  "role": "creator"
}
```

  - Response: AuthResponseDto

```json
{
  "user": {
    "id": 7,
    "email": "new.user@example.com",
    "name": "New User",
    "role": "creator",
    "tenantId": 2,
    "avatarUrl": null,
    "isEmailVerified": false
  },
  "expiresIn": 900
}
```

- POST /auth/login
  - Auth: public
  - Body: LoginDto

```json
{
  "email": "sme1@example.com",
  "password": "test12345"
}
```

  - Response: AuthResponseDto (same shape as signup)

- POST /auth/admin/signup
  - Auth: public (requires ADMIN_SIGNUP_KEY)
  - Body: AdminSignupDto

```json
{
  "email": "admin.user@example.com",
  "name": "Platform Admin",
  "password": "StrongAdminPassword123!",
  "adminSignupKey": "change-me-admin-signup-key"
}
```

  - Response: AuthResponseDto

- POST /auth/admin/login
  - Auth: public
  - Body: LoginDto
  - Response: AuthResponseDto

- POST /auth/refresh
  - Auth: public
  - Body: RefreshTokenDto (optional when ciap_refresh cookie is present)

```json
{
  "refreshToken": "<refresh-token>"
}
```

  - Response: AuthResponseDto

- GET /auth/verify
  - Auth: bearer
  - Response: VerifyResponseDto

```json
{
  "valid": true,
  "userId": 1,
  "email": "admin@example.com",
  "tenantId": 1,
  "role": "admin",
  "sessionId": "7b4e5e22-0a69-4de5-93b9-e46d9454b0f8"
}
```

- POST /auth/logout
  - Auth: bearer
  - Response:

```json
{
  "success": true
}
```

- PATCH /auth/me/password
  - Auth: bearer
  - Body: UpdatePasswordDto

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

  - Response:

```json
{
  "success": true
}
```

- GET /auth/roles
  - Auth: bearer (admin only)
  - Response:

```json
{
  "roles": ["admin", "sme", "creator"]
}
```

### Auth Socials

- GET /auth/socials/oauth2/google/login
  - Auth: public
  - Query: role=creator|sme (optional)
  - Response:

```json
{
  "provider": "google",
  "redirectUri": "http://localhost:3000/auth/socials/google/login/callback",
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "purpose": "login"
}
```

- GET /auth/socials/google/login/callback
  - Auth: public
  - Query: code (required), state (optional)
  - Response: AuthResponseDto (only when FRONTEND_OAUTH_REDIRECT_URI is not set)

- POST /auth/socials/google/token/refresh
  - Auth: bearer
  - Response:

```json
{
  "tokenExpiresAt": "2026-04-09T10:30:00.000Z"
}
```

- GET /auth/socials/google/youtube/metrics
  - Auth: bearer
  - Query:
    - days (optional, 1-90)
    - maxVideos (optional, 1-10)
  - Response: YouTube metrics payload (example from controller)

- GET /auth/socials/google/youtube/metrics/job-payload
  - Auth: bearer
  - Query:
    - days (optional, 1-90)
    - maxVideos (optional, 1-10)
  - Response:

```json
{
  "queue": "youtube",
  "jobName": "youtube.ingestion",
  "payload": {
    "provider": "google",
    "userId": 7,
    "tenantId": 3,
    "days": 30,
    "maxVideos": 20,
    "requestedAt": "2026-04-09T10:00:00.000Z"
  }
}
```

### Ingestion (YouTube)

- GET /ingestion/youtube/metrics
  - Auth: bearer
  - Query:
    - days (optional, 1-90)
    - maxVideos (optional, 1-10)
  - Response: YouTube metrics payload (example from controller)

- GET /ingestion/youtube/oauth2
  - Auth: bearer
  - Response:

```json
{
  "provider": "google",
  "redirectUri": "http://localhost:3000/ingestion/youtube/oauth2/callback",
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "purpose": "youtube-connect"
}
```

- GET /ingestion/youtube/oauth2/callback
  - Auth: public
  - Query:
    - code (required)
    - state (required)
    - days (optional, 1-90)
    - maxVideos (optional, 1-10)
  - Response: YouTube connect + sync payload (example from controller)

- POST /ingestion/youtube/permissions/approve
  - Auth: bearer
  - Body: ApproveYoutubeChannelDto

```json
{
  "youtubeChannelId": "UC123456789"
}
```

  - Response:

```json
{
  "youtubeChannelId": "UC123456789",
  "permissionsApproved": true,
  "approvedAt": "2026-04-15T12:00:00.000Z"
}
```

- POST /ingestion/youtube/approve
  - Auth: bearer
  - Body: ApproveYoutubeChannelDto
  - Response:

```json
{
  "id": 1,
  "youtubeChannelId": "UC123456789",
  "channelTitle": "My Channel",
  "isApproved": true,
  "approvedAt": "2026-04-12T10:30:00.000Z"
}
```

### Creator Insights

- GET /creators/insights/audience
  - Auth: bearer (admin, creator)
  - Query:
    - days (optional, 1-90)
  - Response: CreatorAudienceInsightDto

- GET /creators/insights/content
  - Auth: bearer (admin, creator)
  - Query:
    - limit (optional, 1-50)
  - Response: CreatorContentInsightDto

- GET /creators/insights/performance
  - Auth: bearer (admin, creator)
  - Query:
    - days (optional, 1-90)
    - limit (optional, 1-50)
  - Response: CreatorPerformanceInsightDto

### SME Creator Discovery

- GET /sme/creators/discovery
  - Auth: bearer (admin, sme)
  - Query:
    - query, bioQuery, platform, minInfluenceScore, maxInfluenceScore
    - limit (optional, 1-50), offset (optional, >=0)
  - Response: CreatorDiscoveryResponseDto

- GET /sme/creators/compare
  - Auth: bearer (admin, sme)
  - Query:
    - creatorIds (comma-separated)
    - query
    - limit (optional, 1-20)
  - Response: CreatorCompareResponseDto

- GET /sme/creators/search
  - Auth: bearer
  - Query:
    - query (required)
    - limit (optional, 1-50)
  - Response: CreatorDiscoveryResponseDto

- GET /sme/creators/:id/profile
  - Auth: bearer (admin, sme)
  - Query:
    - days (optional, 1-90)
    - limit (optional, 1-50)
  - Response: CreatorProfileResponseDto

### Search

- GET /search/creators
  - Auth: bearer
  - Query:
    - query (required)
    - limit (optional, 1-50)
  - Response: CreatorSearchResponseDto

### Users

- GET /users/me
  - Auth: bearer
  - Response: MeResponseDto

- POST /users/me/onboard
  - Auth: bearer (creator only)
  - Body: CreatorOnboardDto
  - Response: CreatorOnboardResponseDto

- GET /users/:id
  - Auth: bearer
  - Response: UserDto

- GET /users/:id/platform-status
  - Auth: bearer
  - Response: UserPlatformStatusDto

- GET /users
  - Auth: bearer (sme only)
  - Query:
    - limit (optional, default 10)
    - offset (optional, default 0)
  - Response: UserDto[]

- GET /users/admin/all
  - Auth: bearer (admin only)
  - Query:
    - limit (optional, default 10)
    - offset (optional, default 0)
  - Response: UserDto[]
