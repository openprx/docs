---
title: Gateway
description: Overview of the PRX gateway layer providing HTTP API, WebSocket, and webhook interfaces.
---

# Gateway

The PRX gateway is the network-facing layer that exposes agent capabilities through multiple protocols. It provides HTTP REST APIs, WebSocket connections for real-time streaming, and webhook endpoints for event-driven integrations.

## Overview

The gateway runs as part of the PRX daemon and handles:

- **HTTP API** -- RESTful endpoints for session management, tool execution, and configuration
- **WebSocket** -- bidirectional streaming for real-time agent interactions
- **Webhooks** -- outbound event notifications for integrations
- **Middleware** -- authentication, rate limiting, CORS, and request logging

## Architecture

```
┌─────────────────────────────────┐
│           Gateway                │
│  ┌──────────┐  ┌─────────────┐  │
│  │ HTTP API │  │  WebSocket  │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────┴───────────────┴──────┐  │
│  │       Middleware Stack     │  │
│  └────────────┬──────────────┘  │
│               │                  │
│  ┌────────────┴──────────────┐  │
│  │      Agent Runtime         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Configuration

```toml
[gateway]
bind = "127.0.0.1:3120"
tls_cert = ""
tls_key = ""

[gateway.cors]
allowed_origins = ["*"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
```

## Related Pages

- [HTTP API](./http-api)
- [WebSocket](./websocket)
- [Webhooks](./webhooks)
- [Middleware](./middleware)
