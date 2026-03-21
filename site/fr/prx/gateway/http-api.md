---
title: API HTTP
description: RESTful HTTP API reference for le PRX gateway.
---

# HTTP API

The PRX gateway expose a RESTful HTTP API for managing session d'agents, sending messages, and querying system status.

## Base URL

By default, l'API est disponible at `http://127.0.0.1:3120/api/v1`.

## Endpoints

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions` | Create un nouveau session d'agent |
| `GET` | `/sessions` | List active sessions |
| `GET` | `/sessions/:id` | Get session details |
| `DELETE` | `/sessions/:id` | Terminate a session |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/:id/messages` | Send a message to l'agent |
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

## Voir aussi Pages

- [Gateway Overview](./)
- [WebSocket](./websocket)
- [Middleware](./middleware)
