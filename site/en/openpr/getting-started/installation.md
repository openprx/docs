---
title: Installation
description: Install OpenPR using Docker Compose, Podman, or building from source with Rust and Node.js.
---

# Installation

OpenPR supports three installation methods. Docker Compose is the fastest way to get a fully working instance.

::: tip Recommended
**Docker Compose** brings up all services (API, frontend, worker, MCP server, PostgreSQL) with a single command. No Rust toolchain or Node.js required.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Docker | 20.10+ | Or Podman 3.0+ with podman-compose |
| Docker Compose | 2.0+ | Included with Docker Desktop |
| Rust (source build) | 1.75.0 | Not needed for Docker install |
| Node.js (source build) | 20+ | For building the SvelteKit frontend |
| PostgreSQL (source build) | 15+ | Docker method includes PostgreSQL |
| Disk Space | 500 MB | Images + database |
| RAM | 1 GB | 2 GB+ recommended for production |

## Method 1: Docker Compose (Recommended)

Clone the repository and start all services:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

This starts five services:

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | Database with auto-migration |
| API | `openpr-api` | 8081 (maps to 8080) | REST API server |
| Worker | `openpr-worker` | -- | Background task processor |
| MCP Server | `openpr-mcp-server` | 8090 | MCP tool server |
| Frontend | `openpr-frontend` | 3000 | SvelteKit web UI |

Verify all services are running:

```bash
docker-compose ps
```

::: warning First User
The first user to register automatically becomes the **admin**. Make sure to register your admin account before sharing the URL with others.
:::

### Environment Variables

Edit `.env` to customize your deployment:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (change in production!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger Security
Always change `JWT_SECRET` and database passwords before deploying to production. Use strong, random values.
:::

## Method 2: Podman

OpenPR works with Podman as a Docker alternative. The key difference is that Podman requires `--network=host` for builds due to DNS resolution:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Build images with network access
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Start services
sudo podman-compose up -d
```

::: tip Podman DNS
The frontend Nginx container uses `10.89.0.1` as the DNS resolver (Podman's default network DNS), not `127.0.0.11` (Docker's default). This is already configured in the included Nginx config.
:::

## Method 3: Build from Source

### Backend

```bash
# Prerequisites: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Build all binaries
cargo build --release -p api -p worker -p mcp-server
```

The binaries are located at:
- `target/release/api` -- REST API server
- `target/release/worker` -- Background worker
- `target/release/mcp-server` -- MCP tool server

### Frontend

```bash
cd frontend
npm install    # or: bun install
npm run build  # or: bun run build
```

The build output is in `frontend/build/`. Serve it with Nginx or any static file server.

### Database Setup

Create the database and run migrations:

```bash
# Create database
createdb -U postgres openpr

# Migrations run automatically on first API start
# Or apply manually:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... apply remaining migrations in order
```

### Start Services

```bash
# Terminal 1: API server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## Verify Installation

Once all services are running, verify each endpoint:

```bash
# API health check
curl http://localhost:8080/health

# MCP server health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

Open http://localhost:3000 in your browser to access the web UI.

## Uninstalling

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v removes volumes (database data)
docker rmi $(docker images 'openpr*' -q)
```

### Source Build

```bash
# Stop running services (Ctrl+C in each terminal)
# Remove binaries
rm -f target/release/api target/release/worker target/release/mcp-server

# Drop database (optional)
dropdb -U postgres openpr
```

## Next Steps

- [Quick Start](./quickstart) -- Create your first workspace and project in 5 minutes
- [Docker Deployment](../deployment/docker) -- Production Docker configuration
- [Production Deployment](../deployment/production) -- Caddy, PostgreSQL, and security hardening
