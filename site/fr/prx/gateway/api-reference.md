---
title: Reference API
description: Complete REST API reference for le PRX gateway -- sessions, channels, hooks, MCP, plugins, skills, status, config, and logs.
---

# API Reference

This page documents all endpoints API REST expose par le PRX gateway. L'API est construit sur Axum et uses JSON for request et response bodies. Tous les endpoints sont prefixes with `/api/v1`.

## Base URL

```
http://127.0.0.1:3120/api/v1
```

L'hote and port are configurable:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## Authentication

All API endpoints require a bearer token unless otherwise noted.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

Generate a token with:

```bash
prx auth token
```

## Sessions

Manage session d'agents -- create, list, inspect, and terminate.

### POST /api/v1/sessions

Create un nouveau session d'agent.

**Request:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**Response (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

List active sessions.

**Query Parameters:**

| Parameter | Type | Defaut | Description |
|-----------|------|---------|-------------|
| `status` | `String` | `"active"` | Filter by status: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *all* | Filter by channel name |
| `limit` | `usize` | `50` | Maximum results to retour |
| `offset` | `usize` | `0` | Pagination offset |

**Response (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

Get detailed information about a specific session.

**Response (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

Terminate a session.

**Response (204):** Non content.

## Channels

Query and manage messaging channel connections.

### GET /api/v1/channels

List tous les configures channels and their connection status.

**Response (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

Restart a specific channel connection.

**Response (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

Health check pour un specific channel.

**Response (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## Hooks

Manage webhook endpoints for external integrations.

### GET /api/v1/hooks

List registered webhooks.

**Response (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

Register un nouveau webhook.

**Request:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**Response (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

Remove a webhook.

**Response (204):** Non content.

## MCP

Manage Model Context Protocol server connections.

### GET /api/v1/mcp

List connected MCP servers.

**Response (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

Reconnect to an MCP server.

**Response (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## Plugins

Manage WASM plugins.

### GET /api/v1/plugins

List installed plugins and their status.

**Response (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

Reload a plugin (unload and load again).

**Response (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

Disable a plugin without unloading it.

**Response (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## Skills

Query registered agent skills.

### GET /api/v1/skills

List tous les disponibles skills.

**Response (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## Status

System status and health information.

### GET /api/v1/status

Get overall system status.

**Response (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

Lightweight health check (suitable for load balancer probes).

**Response (200):**

```json
{
  "healthy": true
}
```

## Config

Read and update runtime configuration.

### GET /api/v1/config

Get the current runtime configuration (secrets are redacted).

**Response (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

Update configuration values a l'execution. Changes are applied via hot-reload.

**Request:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**Response (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

Certains changements de configuration necessitent un redemarrage complet and ne peuvent pas etre recharges a chaud. La reponse indiquetes this with `"reload_required": true`.

## Logs

Query agent logs and diagnostics.

### GET /api/v1/logs

Stream or query recent log entries.

**Query Parameters:**

| Parameter | Type | Defaut | Description |
|-----------|------|---------|-------------|
| `level` | `String` | `"info"` | Minimum log level: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *all* | Filter by module name (e.g., `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *1 hour ago* | ISO 8601 timestamp or duration (e.g., `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | Maximum entries to retour |
| `stream` | `bool` | `false` | When true, retours a Server-Sent Events stream |

**Response (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

Server-Sent Events stream for en temps reel log tailing.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## Error Responses

Tous les endpoints retour errors in a consistent format:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `bad_request` | Invalid request parameters or body |
| 401 | `unauthorized` | Missing or invalid bearer token |
| 403 | `forbidden` | Token lacks required permissions |
| 404 | `not_found` | Resource ne fait pas exist |
| 409 | `conflict` | Resource state conflict (e.g., session already terminated) |
| 429 | `rate_limited` | Too many requests; retry after the indicated delay |
| 500 | `internal_error` | Unexpected server error |

## Limiteation de debit

L'API applique rate limits per token:

| Endpoint Group | Limite |
|---------------|-------|
| Sessions (write) | 10 requests/second |
| Sessions (read) | 50 requests/second |
| Config (write) | 5 requests/second |
| All other endpoints | 30 requests/second |

Rate limit headers are inclus dans all responses:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## Voir aussi Pages

- [Gateway Overview](./)
- [HTTP API](./http-api) -- overview of the HTTP API layer
- [WebSocket](./websocket) -- en temps reel WebSocket API
- [Webhooks](./webhooks) -- outgoing webhook configuration
- [Middleware](./middleware) -- request/response middleware pipeline
