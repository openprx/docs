---
title: Production Deployment
description: Deploy OpenPR in production with Caddy reverse proxy, automatic HTTPS, PostgreSQL hardening, and security best practices.
---

# Production Deployment

This guide covers deploying OpenPR in a production environment with HTTPS, a reverse proxy, database hardening, and security best practices.

## Architecture

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>Auto HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## Prerequisites

- A server with at least 2 CPU cores and 2 GB RAM
- A domain name pointing to your server's IP address
- Docker and Docker Compose (or Podman)

## Step 1: Configure the Environment

Create a production `.env` file:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger Secrets
Never commit `.env` files to version control. Use `chmod 600 .env` to restrict file permissions.
:::

## Step 2: Set Up Caddy

Install Caddy on the host system:

```bash
sudo apt install -y caddy
```

Configure the Caddyfile:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically obtains and renews Let's Encrypt TLS certificates.

Start Caddy:

```bash
sudo systemctl enable --now caddy
```

::: tip Alternative: Nginx
If you prefer Nginx, configure it with a proxy pass to port 3000 and use certbot for TLS certificates.
:::

## Step 3: Deploy with Docker Compose

```bash
cd /opt/openpr
docker-compose up -d
```

Verify all services are healthy:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## Step 4: Create Admin Account

Open `https://your-domain.example.com` in your browser and register the admin account.

::: warning First User
The first registered user becomes admin. Register your admin account before sharing the URL.
:::

## Security Checklist

### Authentication

- [ ] Change `JWT_SECRET` to a random 32+ character value
- [ ] Set appropriate token TTL values (shorter for access, longer for refresh)
- [ ] Create the admin account immediately after deployment

### Database

- [ ] Use a strong password for PostgreSQL
- [ ] Do not expose PostgreSQL port (5432) to the internet
- [ ] Enable PostgreSQL SSL for connections (if database is remote)
- [ ] Set up regular database backups

### Network

- [ ] Use Caddy or Nginx with HTTPS (TLS 1.3)
- [ ] Only expose ports 443 (HTTPS) and optionally 8090 (MCP) to the internet
- [ ] Use a firewall (ufw, iptables) to restrict access
- [ ] Consider restricting MCP server access to known IP ranges

### Application

- [ ] Set `RUST_LOG=info` (not debug or trace in production)
- [ ] Monitor disk usage for uploads directory
- [ ] Set up log rotation for container logs

## Database Backups

Set up automated PostgreSQL backups:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Add to cron:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## Monitoring

### Health Checks

Monitor service health endpoints:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### Log Monitoring

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api --tail=100
```

## Scaling Considerations

- **API Server**: Can run multiple replicas behind a load balancer. All instances connect to the same PostgreSQL database.
- **Worker**: Run a single instance to avoid duplicate job processing.
- **MCP Server**: Can run multiple replicas. Each instance is stateless.
- **PostgreSQL**: For high availability, consider PostgreSQL replication or a managed database service.

## Updating

To update OpenPR:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

Database migrations are applied automatically on API server startup.

## Next Steps

- [Docker Deployment](./docker) -- Docker Compose reference
- [Configuration](../configuration/) -- Environment variable reference
- [Troubleshooting](../troubleshooting/) -- Common production issues
