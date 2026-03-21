---
title: Configuration Overview
description: How PRX-WAF configuration works. TOML config file structure, environment variable overrides, and the relationship between file-based and database-stored configuration.
---

# Configuration

PRX-WAF is configured through a TOML file passed via the `-c` / `--config` flag. The default path is `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## Configuration Sources

PRX-WAF uses two configuration layers:

| Source | Scope | Description |
|--------|-------|-------------|
| TOML file | Server startup | Proxy ports, database URL, cache, HTTP/3, security, cluster |
| Database | Runtime | Hosts, rules, certificates, plugins, tunnels, notifications |

The TOML file contains settings needed at startup time (ports, database connection, cluster config). Runtime settings like hosts and rules are stored in PostgreSQL and managed via the admin UI or REST API.

## Configuration File Structure

The TOML config file has the following sections:

```toml
[proxy]          # Reverse proxy listener addresses
[api]            # Admin API listener address
[storage]        # PostgreSQL connection
[cache]          # Response cache settings
[http3]          # HTTP/3 QUIC settings
[security]       # Admin API security (IP allowlist, rate limit, CORS)
[rules]          # Rule engine settings (directory, hot-reload, sources)
[crowdsec]       # CrowdSec integration
[cluster]        # Cluster mode (optional)
```

### Minimal Configuration

A minimal configuration for development:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### Production Configuration

A production configuration with all security features:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Host Configuration

Hosts can be defined in the TOML file for static deployments:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
For dynamic environments, manage hosts via the admin UI or REST API instead of the TOML file. Database-stored hosts take precedence over TOML-defined hosts.
:::

## Database Migrations

PRX-WAF includes 8 migration files that create the required database schema:

```bash
# Run migrations
prx-waf -c configs/default.toml migrate

# Create default admin user
prx-waf -c configs/default.toml seed-admin
```

Migrations are idempotent and safe to run multiple times.

## Docker Environment

In Docker deployments, configuration values are typically set in `docker-compose.yml`:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## Next Steps

- [Configuration Reference](./reference) -- Every TOML key documented with types and defaults
- [Installation](../getting-started/installation) -- Initial setup and database migrations
- [Cluster Mode](../cluster/) -- Cluster-specific configuration
