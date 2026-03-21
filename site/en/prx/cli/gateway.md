---
title: prx gateway
description: Start the standalone HTTP/WebSocket gateway server without channels or cron.
---

# prx gateway

Start the HTTP/WebSocket gateway server as a standalone process. Unlike [`prx daemon`](./daemon), this command only starts the gateway -- no channels, cron scheduler, or evolution engine.

This is useful for deployments where you want to expose the PRX API without the full daemon, or when running channels and scheduling as separate processes.

## Usage

```bash
prx gateway [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Path to configuration file |
| `--port` | `-p` | `3120` | Listen port |
| `--host` | `-H` | `127.0.0.1` | Bind address |
| `--log-level` | `-l` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | Allowed CORS origins (comma-separated) |
| `--tls-cert` | | | Path to TLS certificate file |
| `--tls-key` | | | Path to TLS private key file |

## Endpoints

The gateway exposes the following endpoint groups:

| Path | Method | Description |
|------|--------|-------------|
| `/health` | GET | Health check (returns `200 OK`) |
| `/api/v1/chat` | POST | Send a chat message |
| `/api/v1/chat/stream` | POST | Send a chat message (streaming SSE) |
| `/api/v1/sessions` | GET, POST | Session management |
| `/api/v1/sessions/:id` | GET, DELETE | Single session operations |
| `/api/v1/tools` | GET | List available tools |
| `/api/v1/memory` | GET, POST | Memory operations |
| `/ws` | WS | WebSocket endpoint for real-time communication |
| `/webhooks/:channel` | POST | Incoming webhook receiver for channels |

See [Gateway HTTP API](/en/prx/gateway/http-api) and [Gateway WebSocket](/en/prx/gateway/websocket) for full API documentation.

## Examples

```bash
# Start on default port
prx gateway

# Bind to all interfaces on port 8080
prx gateway --host 0.0.0.0 --port 8080

# With TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# Restrict CORS
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# Debug logging
prx gateway --log-level debug
```

## Behind a Reverse Proxy

In production, place the gateway behind a reverse proxy (Nginx, Caddy, etc.) for TLS termination and load balancing:

```
# Caddy example
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Nginx example
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Signals

| Signal | Behavior |
|--------|----------|
| `SIGHUP` | Reload configuration |
| `SIGTERM` | Graceful shutdown (finishes in-flight requests) |

## Related

- [prx daemon](./daemon) -- full runtime (gateway + channels + cron + evolution)
- [Gateway Overview](/en/prx/gateway/) -- gateway architecture
- [Gateway HTTP API](/en/prx/gateway/http-api) -- REST API reference
- [Gateway WebSocket](/en/prx/gateway/websocket) -- WebSocket protocol
