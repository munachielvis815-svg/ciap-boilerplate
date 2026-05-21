# API Documentation

Updated for the current NestJS codebase on 2026-05-21.

## Base URLs

- Local API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

## Auth Model

- Access token: JWT signed with `ES256`
- Refresh token: JWT signed with `ES512`
- Refresh tokens are session-backed:
  - raw token is delivered in the `ciap_refresh` httpOnly cookie
  - SHA-256 hash is stored in `sessions.refresh_token_hash`
  - refresh rotates by revoking old session and creating a new one
- Successful signup, login, OAuth login callback, and refresh responses set httpOnly cookies:
  - `ciap_access` contains the access token and expires with `expiresIn`
  - `ciap_refresh` contains the refresh token and defaults to 7 days
  - cookies use `SameSite=Lax` and `Secure` in production
- Auth JSON responses do not include `accessToken` or `refreshToken`.

Use bearer auth on protected endpoints:

```http
Authorization: Bearer <access_token>
```

## Endpoint Index

### Root and health

- `GET /` - API metadata
- `GET /health` - basic API health
- `GET /health/db` - database connectivity health
- `GET /health/ready` - readiness status
- `GET /health/cache` - cache connectivity health (returns warning when Redis is unavailable and the app defaults to in-memory cache)

### Auth

- `POST /auth/signup` - create account (public)
- `POST /auth/login` - login with email/password (public)
- `POST /auth/admin/signup` - create admin account (public endpoint, protected by `ADMIN_SIGNUP_KEY`)
- `POST /auth/admin/login` - admin login (public)
- `POST /auth/refresh` - rotate refresh token (public)
- `GET /auth/verify` - verify access token + session (protected)
- `POST /auth/logout` - revoke current session (protected)
- `GET /auth/roles` - list roles (protected, `admin` only)
- `PATCH /auth/me/password` - set or change the authenticated user's password (protected)
  - Request body (JSON): `currentPassword` (optional if no password), `newPassword` (required)
  - Response: `{ "success": true }`

### Auth social providers

- `GET /auth/socials/oauth2/google/login` - build Google OAuth authorization URL for login (public)
- `GET /auth/socials/google/login/callback` - Google OAuth login callback endpoint (public)
- `POST /auth/socials/google/token/refresh` - refresh stored Google OAuth token for current user (protected)
- `POST /auth/socials/google/youtube/disconnect` - disconnect the stored YouTube Google OAuth grant for the current user (protected)
- `GET /auth/socials/google/youtube/metrics` - pull channel + latest 10 videos + analytics metrics + comments + demographics (protected, no persistence)
  - Response may include `analyticsStatus`/`analyticsWarning` and `demographicsStatus`/`demographicsWarning` when analytics access is unavailable.
  - Returns `404` when the authenticated account has no YouTube channel.
- `GET /auth/socials/google/youtube/metrics/job-payload` - prepare BullMQ job payload contract (protected, no enqueue)

Deprecated (excluded from Swagger):

- `POST /auth/socials/google` - legacy Google ID token login
- `GET /auth/socials/oauth2/google` - legacy Google OAuth prepare endpoint
- `GET /auth/socials/google/callback` - legacy Google OAuth callback endpoint

### Ingestion

- `GET /ingestion/youtube/metrics` - pull authenticated user channel + latest 10 videos + analytics metrics + comments + demographics (protected, persisted)
  - Response may include `analyticsStatus`/`analyticsWarning` and `demographicsStatus`/`demographicsWarning` when analytics access is unavailable.
  - Returns `200` with `ingestionStatus=warning` when the authenticated account has no YouTube channel.
- `GET /ingestion/youtube/oauth2` - prepare Google OAuth flow for YouTube connect (protected)
- `GET /ingestion/youtube/oauth2/callback` - Google OAuth callback for YouTube connect + immediate sync (public)
- `POST /ingestion/youtube/permissions/approve` - approve YouTube permissions (protected)
- `POST /ingestion/youtube/approve` - approve YouTube channel for analytics tracking (protected)

### Creator insights

- `GET /creators/insights/audience` - audience insights (protected, creator only)
- `GET /creators/insights/content` - content insights (protected, creator only)
- `GET /creators/insights/performance` - performance insights (protected, creator only)

### SME creator discovery

- `GET /sme/creators/discovery` - creator discovery (protected, sme only)
- `GET /sme/creators/search` - creator search (protected, any role; delegates to universal search)
  - Accepts only `query` and optional `limit` (max 50); other legacy filters are ignored.
- `GET /sme/creators/compare` - compare creators by IDs or search (protected, sme only)
- `GET /sme/creators/:id/profile` - creator profile for SME dashboard (protected, sme only)
- `GET /sme/creators/scouted` - list scouted creators for the authenticated SME (protected, sme only)
- `POST /sme/creators/:id/scout` - add a creator to the authenticated SME's scouted list (protected, sme only)
- `DELETE /sme/creators/:id/scout` - remove a creator from the authenticated SME's scouted list (protected, sme only)

### SME campaigns

- `GET /sme/campaigns` - list campaigns for the authenticated SME (protected, sme only)
- `POST /sme/campaigns` - create an SME campaign (protected, sme only)
- `POST /sme/campaigns/:campaignId/creators` - add a creator to an SME campaign (protected, sme only)

### Search

- `GET /search/creators` - universal creator search (protected, any role)
  - Query params: `query` (required), `limit` (optional, max 50)
  - Searches creator name, niche (creator types/industry), and bio with fuzzy matching.

### Users

- `GET /users/me` - current user dashboard data (protected)
- `GET /users/sme/stats` - SME dashboard KPI stats (protected, `sme` and `admin`)
- `POST /users/me/onboard` - onboard the authenticated creator profile and set creator types (protected, `creator` only)
- `GET /users/:id` - get user by id (protected + RBAC + abilities)
- `GET /users?limit=10&offset=0` - list tenant users (protected, `sme` only)
- `GET /users/admin/all?limit=10&offset=0` - list users across tenants (protected, `admin` only)
- `PATCH /users/me/password` - set or change the authenticated user's password (protected)

## Request and Response Examples

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "name": "New User",
    "password": "StrongPassword123!",
    "role": "creator"
  }'
```

Response shape:

```json
{
  "user": {
    "id": 7,
    "email": "new.user@example.com",
    "name": "New User",
    "role": "user",
    "tenantId": 2,
    "isEmailVerified": false
  },
  "expiresIn": 900
}
```

Tokens are set only as `ciap_access` and `ciap_refresh` httpOnly cookies.

### Login

`POST /auth/login` does not accept admin accounts. Admin must use `/auth/admin/login`.
Both `/auth/login` and `/auth/admin/login` return the tokenless auth response body and set httpOnly token cookies.

For Google OAuth login, when an existing account is already linked to Google, the backend now ignores a mismatched requested onboarding role and signs the user in with the role already stored on their account.

### Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  --cookie "ciap_refresh=<refresh_token>"
```

For backwards compatibility, `/auth/refresh` also accepts `{ "refreshToken": "<refresh_token>" }` in the JSON body. The response rotates both httpOnly cookies and omits token body fields.

### Verify session

```bash
curl http://localhost:3000/auth/verify \
  -H "Authorization: Bearer <access_token>"
```

Response shape:

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

### Start Google OAuth in browser

```text
GET http://localhost:3000/auth/socials/oauth2/google/login?role=creator
```

It returns an `authorizationUrl`. Open it in a browser, approve consent, then Google redirects to:

```text
http://localhost:3000/auth/socials/google/login/callback?code=...&state=...
```

Callback error cases:

- `400` when `code` query param is missing
- `401` when Google returns `invalid_grant` (expired/invalid/reused authorization code)

### Connect YouTube via OAuth

```text
GET http://localhost:3000/ingestion/youtube/oauth2
```

Open the `authorizationUrl`. Google redirects to:

```text
http://localhost:3000/ingestion/youtube/oauth2/callback?code=...&state=...&iss=...&scope=...&authuser=...&prompt=...
```

The callback immediately runs the YouTube ingestion sync and queues influence scoring.

Important:

- Google sign-in (`/auth/socials/oauth2/google/login`) is only for app authentication.
- YouTube ingestion requires the separate `/ingestion/youtube/oauth2` consent flow because the login flow does not grant the YouTube API scopes used by ingestion.
- The YouTube connect flow requests `youtube.readonly`, `youtube.force-ssl`, and `yt-analytics.readonly` in addition to the basic Google identity scopes.

### Disconnect YouTube

```bash
curl -X POST http://localhost:3000/auth/socials/google/youtube/disconnect \
  -H "Authorization: Bearer <access_token>"
```

Response shape:

```json
{
  "success": true
}
```

Notes:

- This removes only the stored `youtube-connect` Google OAuth grant.
- It does not unlink the Google login identity used for first-party app authentication.

### Pull YouTube metrics

```bash
curl "http://localhost:3000/auth/socials/google/youtube/metrics?days=30&maxVideos=10" \
  -H "Authorization: Bearer <access_token>"
```

Notes:

- Pulls channel-level and video-level metrics for the latest videos (`maxVideos <= 10`).
- Pulls Analytics API data for the requested date window (`days <= 90`).
- Pulls top 20 + latest 50 top-level comments per video, but only 5 comment samples per video are returned.
- Videos with disabled comments are skipped for comment sampling instead of failing the whole sync.
- Pulls audience demographics for `ageGroup`, `gender`, and `country`.
- Country audience share is derived from the selected window's country view totals when YouTube does not expose direct `viewerPercentage` by country.
- Metrics are returned directly and are not persisted.
- Response includes BullMQ queue/job payload contract for later queue integration.
- Requires a linked Google OAuth token for the authenticated user; otherwise returns `401` with `oauth2-link-required` details.
- Reconnect guidance includes the required YouTube scopes for comment + analytics access.
- Returns `404` when the authenticated account has no YouTube channel.
- Use `/ingestion/youtube/oauth2` to connect YouTube if missing.

### Ingest YouTube metrics

```bash
curl "http://localhost:3000/ingestion/youtube/metrics?days=30&maxVideos=10" \
  -H "Authorization: Bearer <access_token>"
```

Notes:

- Uses the authenticated user's stored Google OAuth token from the `youtube-connect` grant linked via `/ingestion/youtube/oauth2`.
- If the stored Google token lacks the required YouTube scopes, the API returns `401` with `oauth2-link-required` details so the user can reconnect through `/ingestion/youtube/oauth2`.
- Returns channel info including `statistics.viewCount` and a top-level `channelViews`.
- Pulls analytics metrics for the requested date window (`days <= 90`).
- Pulls top 20 + latest 50 top-level comments per video, but only 5 comment samples per video are returned.
- Videos with disabled comments are skipped for comment sampling instead of failing the whole sync.
- Pulls audience demographics for `ageGroup`, `gender`, and `country`.
- Country audience share is derived from the selected window's country view totals when YouTube does not expose direct `viewerPercentage` by country.
- Persists channel, videos, analytics, comments, and demographics to the database and enqueues a unified `youtube` BullMQ job.
- Returns `401` with `oauth2-link-required` details if no Google OAuth token is available.
- Returns `200` with `ingestionStatus=warning` when the authenticated account has no YouTube channel.

### Approve YouTube permissions

```bash
curl -X POST http://localhost:3000/ingestion/youtube/permissions/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"youtubeChannelId":"UC123456789"}'
```

### Approve YouTube channel

```bash
curl -X POST http://localhost:3000/ingestion/youtube/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"youtubeChannelId":"UC123456789"}'
```

### Protected users endpoint

```bash
curl http://localhost:3000/users/1 \
  -H "Authorization: Bearer <access_token>"
```

### Creator onboarding

```bash
curl -X POST http://localhost:3000/users/me/onboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "creatorTypes": ["gaming", "lifestyle"],
    "displayName": "Creator Name",
    "bio": "Variety creator"
  }'
```

Response shape:

```json
{
  "isOnboarded": true,
  "creatorTypes": ["gaming", "lifestyle"]
}
```

Notes:

- `creatorTypes` accepts multiple values.
- `/users/me` now returns `profile.isOnboarded` and `profile.creatorTypes` from the creator profile record.

### SME dashboard stats

```bash
curl http://localhost:3000/users/sme/stats \
  -H "Authorization: Bearer <access_token>"
```

Response shape:

```json
{
  "totalReach": 1850000,
  "avgInfluenceScore": 72.4,
  "totalCreators": 120,
  "discoveryCoverage": 84
}
```

Notes:

- `totalReach` is aggregated from creator profile `audienceSize`.
- `avgInfluenceScore` is rounded to one decimal place.
- `discoveryCoverage` is the percentage of creators with `user_profiles.is_onboarded = true`.

### Scouted creators

```bash
curl http://localhost:3000/sme/creators/scouted \
  -H "Authorization: Bearer <access_token>"
```

Response shape:

```json
{
  "creators": [
    {
      "userId": 12,
      "displayName": "Creator Name",
      "status": "scouted",
      "audienceSize": 120000,
      "influenceScore": 75.4,
      "category": "gaming"
    }
  ]
}
```

Related shortlist actions:

```bash
curl -X POST http://localhost:3000/sme/creators/12/scout \
  -H "Authorization: Bearer <access_token>"

curl -X DELETE http://localhost:3000/sme/creators/12/scout \
  -H "Authorization: Bearer <access_token>"
```

Both routes return:

```json
{
  "success": true
}
```

### SME campaigns

List campaigns:

```bash
curl http://localhost:3000/sme/campaigns \
  -H "Authorization: Bearer <access_token>"
```

Response shape:

```json
[
  {
    "id": 3,
    "name": "Summer Tech Review",
    "description": "Creator campaign for Q3 product launch.",
    "status": "draft",
    "budgetAmount": 2500,
    "budgetCurrency": "USD",
    "startsAt": "2026-06-01T00:00:00.000Z",
    "endsAt": null,
    "creatorCount": 2,
    "createdAt": "2026-05-21T10:00:00.000Z",
    "updatedAt": "2026-05-21T10:00:00.000Z"
  }
]
```

Create a campaign:

```bash
curl -X POST http://localhost:3000/sme/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Summer Tech Review",
    "description": "Creator campaign for Q3 product launch.",
    "budgetAmount": 2500,
    "budgetCurrency": "USD",
    "startsAt": "2026-06-01T00:00:00.000Z"
  }'
```

Response shape:

```json
{
  "id": 3,
  "name": "Summer Tech Review",
  "description": "Creator campaign for Q3 product launch.",
  "status": "draft",
  "budgetAmount": 2500,
  "budgetCurrency": "USD",
  "startsAt": "2026-06-01T00:00:00.000Z",
  "endsAt": null,
  "creatorCount": 0,
  "createdAt": "2026-05-21T10:00:00.000Z",
  "updatedAt": "2026-05-21T10:00:00.000Z"
}
```

Add a creator to a campaign:

```bash
curl -X POST http://localhost:3000/sme/campaigns/3/creators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "creatorId": 12,
    "status": "shortlisted"
  }'
```

Response shape:

```json
{
  "campaignId": 3,
  "creatorId": 12,
  "displayName": "Creator Name",
  "status": "shortlisted",
  "audienceSize": 120000,
  "influenceScore": 75.4,
  "addedAt": "2026-05-21T10:15:00.000Z"
}
```

## RBAC and Ability Enforcement

- Roles: `admin`, `user`, `sme`, `creator`
- Guards on protected user endpoints:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `AbilitiesGuard`
- Example:
  - `/users/:id` accepts abilities `users:read:any`, `users:read:tenant`, `users:read:self`
  - `/users` list requires `users:list:tenant` (`sme`)
  - `/users/admin/all` requires `users:list:any` (`admin`)
  - social token refresh + YouTube pull endpoints enforce dedicated social abilities

## Error Contract

The global filters return safe JSON. Typical shape:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2026-04-08T15:30:00.000Z",
  "path": "/auth/verify"
}
```

- 4xx errors are logged as warnings.
- 5xx errors are logged with server-side stack details.
- Internal stack traces are not returned to clients.

## Implementation Notes

- `GET /auth/verify` is intentionally a `GET` endpoint using bearer token auth.
- OAuth callback routes are `GET` because providers redirect with query params (`code`, etc.).
- API version prefix is not currently applied in route registration.
- Duplicate Google auth route overlap was removed:
  - old mixed routes under `/auth/google*` and `/auth/oauth2/*` were replaced with `/auth/socials/*`.
  - health functionality is owned by `HealthModule` routes under `/health*`.

## When API Changes

If routes, DTOs, guards, or auth flow change, update in the same pull request:

1. this file (`docs/api.md`)
2. `docs/implementation-guide.md` (if workflow or conventions changed)
3. Swagger decorators in controllers
