---
title: Middleware
description: Gateway middleware stack for authentication, rate limiting, CORS, and logging.
---

# Middleware

The PRX gateway uses a composable middleware stack to handle cross-cutting concerns like authentication, rate limiting, CORS, and request logging.

## Middleware Stack

Requests pass through the middleware stack in order:

1. **Request logging** -- log incoming requests with timing
2. **CORS** -- handle cross-origin resource sharing headers
3. **Authentication** -- validate bearer tokens or API keys
4. **Rate limiting** -- enforce per-client request limits
5. **Request routing** -- dispatch to the appropriate handler

## Authentication Middleware

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## Rate Limiting

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## Request Logging

All API requests are logged with method, path, status code, and response time. Log level can be configured:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## Related Pages

- [Gateway Overview](./)
- [HTTP API](./http-api)
- [Security](/en/prx/security/)
