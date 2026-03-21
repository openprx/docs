---
title: Installation
description: Install Fenfa using Docker, Docker Compose, or build from source with Go and Node.js.
---

# Installation

Fenfa supports two installation methods: Docker (recommended) and building from source.

::: tip Recommended
**Docker** is the fastest way to get started. A single command gives you a fully working Fenfa instance with no build tools required.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Docker | 20.10+ | Or Podman 3.0+ |
| Go (source build only) | 1.25+ | Not needed for Docker |
| Node.js (source build only) | 20+ | For building the frontend |
| Disk Space | 100 MB | Plus storage for uploaded builds |

## Method 1: Docker (Recommended)

Pull and run the official image:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

Visit `http://localhost:8000/admin` and log in with the default token `dev-admin-token`.

::: warning Security
The default tokens are for development only. See [Production Deployment](../deployment/production) to configure secure tokens before exposing Fenfa to the internet.
:::

### With Persistent Storage

Mount volumes for the database and uploaded files:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### With Custom Configuration

Mount a `config.json` file for full control over all settings:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

See [Configuration Reference](../configuration/) for all available options.

### Environment Variables

Override configuration values without a config file:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| Variable | Description | Default |
|----------|-------------|---------|
| `FENFA_PORT` | HTTP port | `8000` |
| `FENFA_DATA_DIR` | Database directory | `data` |
| `FENFA_PRIMARY_DOMAIN` | Public domain URL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | Admin token | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | Upload token | `dev-upload-token` |

## Method 2: Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

Start the service:

```bash
docker compose up -d
```

## Method 3: Build from Source

Clone the repository:

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Using Make

The Makefile automates the full build:

```bash
make build   # builds frontend + backend
make run     # starts the server
```

### Manual Build

Build the frontend applications first, then the Go backend:

```bash
# Build the public download page
cd web/front && npm ci && npm run build && cd ../..

# Build the admin panel
cd web/admin && npm ci && npm run build && cd ../..

# Build the Go binary
go build -o fenfa ./cmd/server
```

The frontend is compiled into `internal/web/dist/` and embedded into the Go binary via `go:embed`. The resulting `fenfa` binary is fully self-contained.

### Run the Binary

```bash
./fenfa
```

Fenfa starts on port 8000 by default. The SQLite database is created automatically in the `data/` directory.

## Verify Installation

Open your browser to `http://localhost:8000/admin` and log in with the admin token. You should see the admin dashboard.

Check the health endpoint:

```bash
curl http://localhost:8000/healthz
```

Expected response:

```json
{"ok": true}
```

## Next Steps

- [Quick Start](./quickstart) -- Upload your first build in 5 minutes
- [Configuration Reference](../configuration/) -- All configuration options
- [Docker Deployment](../deployment/docker) -- Docker Compose and multi-architecture builds
