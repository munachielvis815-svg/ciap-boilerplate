# API Documentation

Updated for the current NestJS codebase on 2026-04-08.

## Base URLs

- Local API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

## Auth Model

- Access token: JWT signed with `ES256`
- Refresh token: JWT signed with `ES512`
- Refresh tokens are session-backed:
  - raw token is returned once to client
  - SHA-256 hash is stored in `sessions.refresh_token_hash`
  - refresh rotates by revoking old session and creating a new one

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

### Auth

- `POST /auth/signup` - create account (public)
- `POST /auth/login` - login with email/password (public)
- `POST /auth/google` - login/signup with Google ID token (public)
- `POST /auth/refresh` - rotate refresh token (public)
- `GET /auth/verify` - verify access token + session (protected)
- `POST /auth/logout` - revoke current session (protected)
- `GET /auth/oauth2/:provider` - build OAuth authorization URL (public, Google implemented)
- `GET /auth/oauth2/:provider/callback` - provider callback endpoint (public)
- `GET /auth/google/callback` - Google callback shortcut (public)
- `GET /auth/roles` - list roles (protected, `admin` only)

### Users

- `GET /users/:id` - get user by id (protected + RBAC + abilities)
- `GET /users?limit=10&offset=0` - list users (protected + RBAC + abilities)

## Request and Response Examples

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "name": "New User",
    "password": "StrongPassword123!",
    "role": "user"
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
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "expiresIn": 900
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin12345"
  }'
```

### Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

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
GET http://localhost:3000/auth/oauth2/google
```

It returns an `authorizationUrl`. Open it in a browser, approve consent, then Google redirects to:

```text
http://localhost:3000/auth/google/callback?code=...
```

### Direct Google token login

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "<google_id_token>",
    "role": "creator"
  }'
```

### Protected users endpoint

```bash
curl http://localhost:3000/users/1 \
  -H "Authorization: Bearer <access_token>"
```

## RBAC and Ability Enforcement

- Roles: `admin`, `user`, `sme`, `creator`
- Guards on protected user endpoints:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `AbilitiesGuard`
- Example:
  - `/users/:id` accepts abilities `users:read:any`, `users:read:tenant`, `users:read:self`
  - `/users` list accepts `users:list:any` or `users:list:tenant`

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

## When API Changes

If routes, DTOs, guards, or auth flow change, update in the same pull request:

1. this file (`docs/api.md`)
2. `docs/implementation-guide.md` (if workflow or conventions changed)
3. Swagger decorators in controllers

