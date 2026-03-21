---
title: HTTP API
description: RESTful HTTP API reference for the PRX gateway.
---

# HTTP API

The PRX gateway exposes a RESTful HTTP API for managing agent sessions, sending messages, and querying system status.

## Base URL

By default, the API is available at `http://127.0.0.1:3120/api/v1`.

## Endpoints

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions` | Create a new agent session |
| `GET` | `/sessions` | List active sessions |
| `GET` | `/sessions/:id` | Get session details |
| `DELETE` | `/sessions/:id` | Terminate a session |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/:id/messages` | Send a message to the agent |
| `GET` | `/sessions/:id/messages` | Get message history |

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/info` | System information |
| `GET` | `/metrics` | Prometheus metrics |

## Authentication

API requests require a bearer token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## Related Pages

- [Gateway Overview](./)
- [WebSocket](./websocket)
- [Middleware](./middleware)
