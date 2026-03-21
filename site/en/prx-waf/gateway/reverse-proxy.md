---
title: Reverse Proxy Configuration
description: Configure PRX-WAF as a reverse proxy. Host routing, upstream backends, load balancing, request/response headers, and health checks.
---

# Reverse Proxy Configuration

PRX-WAF acts as a reverse proxy, forwarding client requests to upstream backend servers after passing through the WAF detection pipeline. This page covers host routing, load balancing, and proxy configuration.

## Host Configuration

Each protected domain requires a host entry that maps incoming requests to an upstream backend. Hosts can be configured in three ways:

### Via TOML Config File

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### Via Admin UI

1. Navigate to **Hosts** in the sidebar
2. Click **Add Host**
3. Fill in the host details
4. Click **Save**

### Via REST API

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## Host Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `host` | `string` | Yes | The domain name to match (e.g., `example.com`) |
| `port` | `integer` | Yes | Port to listen on (usually `80` or `443`) |
| `remote_host` | `string` | Yes | Upstream backend IP or hostname |
| `remote_port` | `integer` | Yes | Upstream backend port |
| `ssl` | `boolean` | No | Whether upstream uses HTTPS (default: `false`) |
| `guard_status` | `boolean` | No | Enable WAF protection for this host (default: `true`) |

## Load Balancing

PRX-WAF uses weighted round-robin load balancing across upstream backends. When multiple backends are configured for a host, traffic is distributed proportionally to their weights.

::: info
Multiple upstream backends per host can be configured via the admin UI or API. The TOML config file supports single-backend host entries.
:::

## Request Headers

PRX-WAF automatically adds standard proxy headers to forwarded requests:

| Header | Value |
|--------|-------|
| `X-Real-IP` | Client's original IP address |
| `X-Forwarded-For` | Client IP (appended to existing chain) |
| `X-Forwarded-Proto` | `http` or `https` |
| `X-Forwarded-Host` | Original Host header value |

## Request Body Size Limit

The maximum request body size is controlled by the security configuration:

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

Requests exceeding this limit are rejected with a 413 Payload Too Large response before reaching the WAF pipeline.

## Managing Hosts

### List All Hosts

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### Update a Host

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### Delete a Host

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## IP-Based Rules

PRX-WAF supports IP-based allow and block rules that are evaluated in Phases 1-4 of the detection pipeline:

```bash
# Add an IP allowlist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Add an IP blocklist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## Next Steps

- [SSL/TLS](./ssl-tls) -- Enable HTTPS with Let's Encrypt
- [Gateway Overview](./index) -- Response caching and reverse tunnels
- [Configuration Reference](../configuration/reference) -- All proxy configuration keys
