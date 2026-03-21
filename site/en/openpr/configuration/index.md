---
title: Configuration Reference
description: Complete reference for all OpenPR environment variables and configuration options for API, worker, MCP server, frontend, and database.
---

# Configuration Reference

OpenPR is configured through environment variables. All services read from the same `.env` file when using Docker Compose, or individual environment variables when running directly.

## API Server

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `api` | Application identifier for logging |
| `BIND_ADDR` | `0.0.0.0:8080` | Address and port the API listens on |
| `DATABASE_URL` | -- | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-production` | Secret key for signing JWT tokens |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 days) | Access token lifetime in seconds |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 days) | Refresh token lifetime in seconds |
| `RUST_LOG` | `info` | Log level (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | Directory for file uploads |

::: danger Security
Always change `JWT_SECRET` to a strong, random value in production. Use at least 32 characters of random data:
```bash
openssl rand -hex 32
```
:::

## Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | -- | Full PostgreSQL connection string |
| `POSTGRES_DB` | `openpr` | Database name |
| `POSTGRES_USER` | `openpr` | Database user |
| `POSTGRES_PASSWORD` | `openpr` | Database password |

Connection string format:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
When using Docker Compose, the database service is named `postgres`, so the connection string is:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `worker` | Application identifier |
| `DATABASE_URL` | -- | PostgreSQL connection string |
| `JWT_SECRET` | -- | Must match the API server value |
| `RUST_LOG` | `info` | Log level |

The worker processes background tasks from the `job_queue` and `scheduled_jobs` tables.

## MCP Server

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `mcp-server` | Application identifier |
| `OPENPR_API_URL` | -- | API server URL (including proxy if applicable) |
| `OPENPR_BOT_TOKEN` | -- | Bot token with `opr_` prefix |
| `OPENPR_WORKSPACE_ID` | -- | Default workspace UUID |
| `DATABASE_URL` | -- | PostgreSQL connection string |
| `JWT_SECRET` | -- | Must match the API server value |
| `DEFAULT_AUTHOR_ID` | -- | Fallback author UUID for MCP operations |
| `RUST_LOG` | `info` | Log level |

### MCP Transport Options

The MCP server binary accepts command-line arguments:

```bash
# HTTP mode (default)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio mode (for Claude Desktop, Codex)
mcp-server --transport stdio

# Subcommand form
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | API server URL for the frontend to connect to |

::: tip Reverse Proxy
In production with a reverse proxy (Caddy/Nginx), `VITE_API_URL` should point to the proxy URL that routes to the API server.
:::

## Docker Compose Ports

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| PostgreSQL | 5432 | 5432 | Database |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | Background tasks (no port) |
| MCP Server | 8090 | 8090 | MCP tools |
| Frontend | 80 | 3000 | Web UI |

## Example .env File

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## Log Levels

OpenPR uses the `tracing` crate for structured logging. Set `RUST_LOG` to control verbosity:

| Level | Description |
|-------|-------------|
| `error` | Only errors |
| `warn` | Errors and warnings |
| `info` | Normal operational messages (default) |
| `debug` | Detailed debugging information |
| `trace` | Very verbose, includes all internal operations |

Per-module filtering is supported:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## Next Steps

- [Docker Deployment](../deployment/docker) -- Docker Compose configuration
- [Production Deployment](../deployment/production) -- Caddy, security, and scaling
- [Installation](../getting-started/installation) -- Getting started
