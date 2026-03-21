---
title: Docker Deployment
description: Deploy OpenPR with Docker Compose or Podman. Includes service configuration, networking, volumes, and health checks.
---

# Docker Deployment

OpenPR provides a `docker-compose.yml` that brings up all required services with a single command.

## Quick Start

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## Service Architecture

```mermaid
graph LR
    subgraph Docker["Docker Network (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["API Server<br/>:8080"]
        WORKER["Worker"]
        MCP["MCP Server<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Users<br/>Browser"] -->|":3000"| FE
    AIBOT["AI Assistants"] -->|":8090"| MCP
```

## Services

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

Migrations in the `migrations/` directory are automatically executed on first start via the PostgreSQL `docker-entrypoint-initdb.d` mechanism.

### API Server

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

The worker has no exposed ports -- it connects to PostgreSQL directly to process background jobs.

### MCP Server

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## Volumes

| Volume | Purpose |
|--------|---------|
| `pgdata` | PostgreSQL data persistence |
| `./uploads` | File upload storage |
| `./migrations` | Database migration scripts |

## Health Checks

All services include health checks:

| Service | Check | Interval |
|---------|-------|----------|
| PostgreSQL | `pg_isready` | 5s |
| API | `curl /health` | 10s |
| MCP Server | `curl /health` | 10s |
| Frontend | `wget /health` | 30s |

## Common Operations

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Connect to database
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

For Podman users, the key differences are:

1. Build with `--network=host` for DNS access:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. Frontend Nginx uses `10.89.0.1` as DNS resolver (Podman default) instead of `127.0.0.11` (Docker default).

3. Use `sudo podman-compose` instead of `docker-compose`.

## Next Steps

- [Production Deployment](./production) -- Caddy reverse proxy, HTTPS, and security
- [Configuration](../configuration/) -- Environment variable reference
- [Troubleshooting](../troubleshooting/) -- Common Docker issues
