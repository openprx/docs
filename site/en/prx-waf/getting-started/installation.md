---
title: Installation
description: Install PRX-WAF using Docker Compose, Cargo, or by building from source. Includes prerequisites, platform notes, and post-install verification.
---

# Installation

PRX-WAF supports three installation methods. Choose the one that best fits your workflow.

::: tip Recommended
**Docker Compose** is the fastest way to get started. It brings up PRX-WAF, PostgreSQL, and the admin UI in a single command.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Operating System | Linux (x86_64, aarch64), macOS (12+) | Windows via WSL2 |
| PostgreSQL | 16+ | Included in Docker Compose |
| Rust (source build only) | 1.82.0 | Not needed for Docker install |
| Node.js (admin UI build only) | 18+ | Not needed for Docker install |
| Docker | 20.10+ | Or Podman 3.0+ |
| Disk Space | 500 MB | ~100 MB binary + ~400 MB PostgreSQL data |
| RAM | 512 MB | 2 GB+ recommended for production |

## Method 1: Docker Compose (Recommended)

Clone the repository and start all services with Docker Compose:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Review and edit environment variables in docker-compose.yml
# (database password, admin credentials, listen ports)
docker compose up -d
```

This starts three containers:

| Container | Port | Description |
|-----------|------|-------------|
| `prx-waf` | `80`, `443` | Reverse proxy (HTTP + HTTPS) |
| `prx-waf` | `9527` | Admin API + Vue 3 UI |
| `postgres` | `5432` | PostgreSQL 16 database |

Verify the deployment:

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:9527/health
```

Open the admin UI at `http://localhost:9527` and log in with the default credentials: `admin` / `admin`.

::: warning Change Default Password
Change the default admin password immediately after first login. Go to **Settings > Account** in the admin UI or use the API.
:::

### Docker Compose with Podman

If you use Podman instead of Docker:

```bash
podman-compose up -d --build
```

::: info Podman DNS
When using Podman, the DNS resolver address for inter-container communication is `10.89.0.1` instead of Docker's `127.0.0.11`. The included `docker-compose.yml` handles this automatically.
:::

## Method 2: Cargo Install

If you have Rust installed, you can install PRX-WAF from the repository:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

The binary is located at `target/release/prx-waf`. Copy it to your PATH:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Build Dependencies
Cargo build compiles native dependencies. On Debian/Ubuntu you may need:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
On macOS, Xcode Command Line Tools are required:
```bash
xcode-select --install
```
:::

### Database Setup

PRX-WAF requires a PostgreSQL 16+ database:

```bash
# Create database and user
createdb prx_waf
createuser prx_waf

# Run migrations
./target/release/prx-waf -c configs/default.toml migrate

# Create default admin user (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### Start the Server

```bash
./target/release/prx-waf -c configs/default.toml run
```

This starts the reverse proxy on ports 80/443 and the admin API on port 9527.

## Method 3: Build from Source (Development)

For development with live reload of the admin UI:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Build the Rust backend
cargo build

# Build the admin UI
cd web/admin-ui
npm install
npm run build
cd ../..

# Start the development server
cargo run -- -c configs/default.toml run
```

### Build the Admin UI for Production

```bash
cd web/admin-ui
npm install
npm run build
```

The built files are embedded into the Rust binary at compile time and served by the API server.

## systemd Service

For production deployments on bare metal, create a systemd service:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## Verify Installation

After installation, verify that PRX-WAF is running:

```bash
# Check health endpoint
curl http://localhost:9527/health

# Check admin UI
curl -s http://localhost:9527 | head -5
```

Log in to the admin UI at `http://localhost:9527` to verify the dashboard loads correctly.

## Next Steps

- [Quick Start](./quickstart) -- Protect your first application in 5 minutes
- [Configuration](../configuration/) -- Customize PRX-WAF settings
- [Rule Engine](../rules/) -- Understand the detection pipeline
