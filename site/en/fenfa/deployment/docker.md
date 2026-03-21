---
title: Docker Deployment
description: Deploy Fenfa with Docker and Docker Compose. Container configuration, volumes, multi-architecture builds, and health checks.
---

# Docker Deployment

Fenfa ships as a single Docker image that includes the Go binary with embedded frontend. No additional containers are needed -- just mount volumes for persistent data.

## Quick Start

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

Create a `.env` file alongside the compose file:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

Start the service:

```bash
docker compose up -d
```

## Volumes

| Mount Point | Purpose | Backup Required |
|-------------|---------|-----------------|
| `/data` | SQLite database | Yes |
| `/app/uploads` | Uploaded binary files | Yes (unless using S3) |
| `/app/config.json` | Configuration file (optional) | Yes |

::: warning Data Persistence
Without volume mounts, all data is lost when the container is recreated. Always mount `/data` and `/app/uploads` for production use.
:::

## Using a Config File

Mount a config file for full control:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## Health Check

Fenfa exposes a health endpoint at `/healthz`:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

The Docker Compose example above includes a health check configuration. For orchestrators like Kubernetes or Nomad, use this endpoint for liveness and readiness probes.

## Multi-Architecture

Fenfa's Docker image supports both `linux/amd64` and `linux/arm64`. Docker automatically pulls the correct architecture for your host.

To build multi-architecture images yourself:

```bash
./scripts/docker-build.sh
```

This uses Docker Buildx to create images for both architectures.

## Resource Requirements

Fenfa is lightweight:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 64 MB | 256 MB |
| Disk | 100 MB (app) | Depends on uploaded files |

The SQLite database and Go binary have minimal overhead. Resource usage scales primarily with upload storage and concurrent connections.

## Logs

View container logs:

```bash
docker logs -f fenfa
```

Fenfa logs to stdout in structured format, compatible with log aggregation tools.

## Updating

```bash
docker compose pull
docker compose up -d
```

::: tip Zero-Downtime Updates
Fenfa starts quickly (< 1 second). For near-zero-downtime updates, use a reverse proxy health check that automatically routes traffic to the new container once it passes the health check.
:::

## Next Steps

- [Production Deployment](./production) -- Reverse proxy, TLS, and security
- [Configuration Reference](../configuration/) -- All configuration options
- [Troubleshooting](../troubleshooting/) -- Common Docker issues
