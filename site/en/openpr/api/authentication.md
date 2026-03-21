---
title: Authentication
description: OpenPR uses JWT tokens for user authentication and bot tokens for AI/MCP access. Learn about registration, login, token refresh, and bot tokens.
---

# Authentication

OpenPR uses **JWT (JSON Web Tokens)** for user authentication and **bot tokens** for AI assistant and MCP server access.

## User Authentication (JWT)

### Register

Create a new account:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

Response:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip First User
The first registered user automatically receives the `admin` role. All subsequent users are `user` by default.
:::

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

Response includes `access_token`, `refresh_token`, and user info with `role`.

### Using the Access Token

Include the access token in the `Authorization` header for all authenticated requests:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### Token Refresh

When the access token expires, use the refresh token to get a new pair:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### Get Current User

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

Returns the current user's profile including `role` (admin/user).

## Token Configuration

JWT token lifetimes are configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Secret key for signing tokens |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 days) | Access token lifetime |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 days) | Refresh token lifetime |

::: danger Production Security
Always set `JWT_SECRET` to a strong, random value in production. The default value is insecure.
:::

## Bot Token Authentication

Bot tokens provide authentication for AI assistants and automated tools. They are workspace-scoped and use the `opr_` prefix.

### Creating Bot Tokens

Bot tokens are managed through the workspace settings UI or API:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### Using Bot Tokens

Bot tokens are used in the same way as JWT tokens:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### Bot Token Properties

| Property | Description |
|----------|-------------|
| Prefix | `opr_` |
| Scope | One workspace |
| Entity Type | Creates a `bot_mcp` user entity |
| Permissions | Same as workspace member |
| Audit Trail | All actions logged under bot user |

## Auth Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login and get tokens |
| `/api/auth/refresh` | POST | Refresh token pair |
| `/api/auth/me` | GET | Get current user info |

## Next Steps

- [Endpoints Reference](./endpoints) -- Complete API documentation
- [MCP Server](../mcp-server/) -- Bot token usage with MCP
- [Members & Permissions](../workspace/members) -- Role-based access
