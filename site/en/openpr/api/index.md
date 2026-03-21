---
title: REST API Overview
description: OpenPR exposes a comprehensive REST API for managing workspaces, projects, issues, governance, and more. Built with Rust and Axum.
---

# REST API Overview

OpenPR provides a RESTful API built with **Rust** and **Axum** for programmatic access to all platform features. The API supports JSON request/response formats and JWT-based authentication.

## Base URL

```
http://localhost:8080/api
```

In production deployments behind a reverse proxy (Caddy/Nginx), the API is typically proxied through the frontend URL.

## Response Format

All API responses follow a consistent JSON structure:

### Success

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Error

```json
{
  "code": 400,
  "message": "Detailed error description"
}
```

Common error codes:

| Code | Meaning |
|------|---------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 500 | Internal server error |

## API Categories

| Category | Base Path | Description |
|----------|-----------|-------------|
| [Authentication](./authentication) | `/api/auth/*` | Register, login, token refresh |
| Projects | `/api/workspaces/*/projects/*` | CRUD, members, settings |
| Issues | `/api/projects/*/issues/*` | CRUD, assign, label, comment |
| Board | `/api/projects/*/board` | Kanban board state |
| Sprints | `/api/projects/*/sprints/*` | Sprint CRUD and planning |
| Labels | `/api/labels/*` | Label CRUD |
| Search | `/api/search` | Full-text search |
| Proposals | `/api/proposals/*` | Create, vote, submit, archive |
| Governance | `/api/governance/*` | Config, audit logs |
| Decisions | `/api/decisions/*` | Decision records |
| Trust Scores | `/api/trust-scores/*` | Scores, history, appeals |
| Veto | `/api/veto/*` | Veto, escalation |
| AI Agents | `/api/projects/*/ai-agents/*` | Agent management |
| AI Tasks | `/api/projects/*/ai-tasks/*` | Task assignment |
| Bot Tokens | `/api/workspaces/*/bots` | Bot token CRUD |
| File Upload | `/api/v1/upload` | Multipart file upload |
| Webhooks | `/api/workspaces/*/webhooks/*` | Webhook CRUD |
| Admin | `/api/admin/*` | System management |

See [Endpoints Reference](./endpoints) for the complete API reference.

## Content Type

All POST/PUT/PATCH requests must use `Content-Type: application/json`, except file uploads which use `multipart/form-data`.

## Pagination

List endpoints support pagination:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## Full-Text Search

The search endpoint uses PostgreSQL full-text search across issues, comments, and proposals:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## Health Check

The API server exposes a health endpoint that does not require authentication:

```bash
curl http://localhost:8080/health
```

## Next Steps

- [Authentication](./authentication) -- JWT authentication and bot tokens
- [Endpoints Reference](./endpoints) -- Complete endpoint documentation
- [MCP Server](../mcp-server/) -- AI-friendly interface with 34 tools
