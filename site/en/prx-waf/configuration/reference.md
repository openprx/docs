---
title: Configuration Reference
description: Complete reference for every PRX-WAF TOML configuration key, including types, default values, and detailed descriptions.
---

# Configuration Reference

This page documents every configuration key in the PRX-WAF TOML config file. The default configuration file is `configs/default.toml`.

## Proxy Settings (`[proxy]`)

Settings that control the reverse proxy listener.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | HTTP listener address |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | HTTPS listener address |
| `worker_threads` | `integer \| null` | `null` (CPU count) | Number of proxy worker threads. When null, uses the number of logical CPU cores. |

## API Settings (`[api]`)

Settings for the management API and admin UI.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | Admin API + UI listener address. Bind to `127.0.0.1` in production to restrict access to localhost. |

## Storage Settings (`[storage]`)

PostgreSQL database connection.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | PostgreSQL connection URL |
| `max_connections` | `integer` | `20` | Maximum number of database connections in the pool |

## Cache Settings (`[cache]`)

Response caching configuration using an in-memory moka LRU cache.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable response caching |
| `max_size_mb` | `integer` | `256` | Maximum cache size in megabytes |
| `default_ttl_secs` | `integer` | `60` | Default time-to-live for cached responses (seconds) |
| `max_ttl_secs` | `integer` | `3600` | Maximum TTL cap (seconds). Responses cannot be cached longer than this regardless of upstream headers. |

## HTTP/3 Settings (`[http3]`)

HTTP/3 via QUIC (Quinn library).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable HTTP/3 support |
| `listen_addr` | `string` | `"0.0.0.0:443"` | QUIC listener address (UDP) |
| `cert_pem` | `string` | -- | Path to TLS certificate (PEM format) |
| `key_pem` | `string` | -- | Path to TLS private key (PEM format) |

::: warning
HTTP/3 requires valid TLS certificates. Both `cert_pem` and `key_pem` must be set when `enabled = true`.
:::

## Security Settings (`[security]`)

Admin API and proxy security configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | List of IPs/CIDRs allowed to access the admin API. Empty means allow all. |
| `max_request_body_bytes` | `integer` | `10485760` (10 MB) | Maximum request body size in bytes. Requests exceeding this are rejected with 413. |
| `api_rate_limit_rps` | `integer` | `0` | Per-IP rate limit for the admin API (requests per second). `0` means disabled. |
| `cors_origins` | `string[]` | `[]` | CORS allowed origins for the admin API. Empty means allow all origins. |

## Rule Settings (`[rules]`)

Rule engine configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dir` | `string` | `"rules/"` | Directory containing rule files |
| `hot_reload` | `boolean` | `true` | Enable file system watching for automatic rule reload |
| `reload_debounce_ms` | `integer` | `500` | Debounce window for file change events (milliseconds) |
| `enable_builtin_owasp` | `boolean` | `true` | Enable built-in OWASP CRS rules |
| `enable_builtin_bot` | `boolean` | `true` | Enable built-in bot detection rules |
| `enable_builtin_scanner` | `boolean` | `true` | Enable built-in scanner detection rules |

### Rule Sources (`[[rules.sources]]`)

Configure multiple rule sources (local directories or remote URLs):

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `name` | `string` | Yes | Source name (e.g., `"custom"`, `"owasp-crs"`) |
| `path` | `string` | No | Local directory path |
| `url` | `string` | No | Remote URL for rule fetching |
| `format` | `string` | Yes | Rule format: `"yaml"`, `"json"`, or `"modsec"` |
| `update_interval` | `integer` | No | Auto-update interval in seconds (remote sources only) |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## CrowdSec Settings (`[crowdsec]`)

CrowdSec threat intelligence integration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable CrowdSec integration |
| `mode` | `string` | `"bouncer"` | Integration mode: `"bouncer"`, `"appsec"`, or `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI URL |
| `api_key` | `string` | `""` | Bouncer API key |
| `update_frequency_secs` | `integer` | `10` | Decision cache refresh interval (seconds) |
| `fallback_action` | `string` | `"allow"` | Action when LAPI is unreachable: `"allow"`, `"block"`, or `"log"` |
| `appsec_endpoint` | `string` | -- | AppSec HTTP inspection endpoint URL (optional) |
| `appsec_key` | `string` | -- | AppSec API key (optional) |

## Host Configuration (`[[hosts]]`)

Static host entries (can also be managed via admin UI/API):

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `host` | `string` | Yes | Domain name to match |
| `port` | `integer` | Yes | Listen port (usually 80 or 443) |
| `remote_host` | `string` | Yes | Upstream backend IP or hostname |
| `remote_port` | `integer` | Yes | Upstream backend port |
| `ssl` | `boolean` | No | Use HTTPS to upstream (default: false) |
| `guard_status` | `boolean` | No | Enable WAF protection (default: true) |

## Cluster Settings (`[cluster]`)

Multi-node cluster configuration. See [Cluster Mode](../cluster/) for details.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable cluster mode |
| `node_id` | `string` | `""` (auto) | Unique node identifier. Auto-generated if empty. |
| `role` | `string` | `"auto"` | Node role: `"auto"`, `"main"`, or `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | QUIC listen address for inter-node communication |
| `seeds` | `string[]` | `[]` | Seed node addresses for cluster join |

### Cluster Crypto (`[cluster.crypto]`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ca_cert` | `string` | -- | Path to CA certificate (PEM) |
| `ca_key` | `string` | -- | Path to CA private key (main node only) |
| `node_cert` | `string` | -- | Path to node certificate (PEM) |
| `node_key` | `string` | -- | Path to node private key (PEM) |
| `auto_generate` | `boolean` | `true` | Auto-generate certificates on first startup |
| `ca_validity_days` | `integer` | `3650` | CA certificate validity (days) |
| `node_validity_days` | `integer` | `365` | Node certificate validity (days) |
| `renewal_before_days` | `integer` | `7` | Auto-renew this many days before expiry |

### Cluster Sync (`[cluster.sync]`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rules_interval_secs` | `integer` | `10` | Rule version check interval |
| `config_interval_secs` | `integer` | `30` | Config sync interval |
| `events_batch_size` | `integer` | `100` | Flush event batch at this count |
| `events_flush_interval_secs` | `integer` | `5` | Flush events even if batch not full |
| `stats_interval_secs` | `integer` | `10` | Statistics reporting interval |
| `events_queue_size` | `integer` | `10000` | Event queue size (drops oldest if full) |

### Cluster Election (`[cluster.election]`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `timeout_min_ms` | `integer` | `150` | Minimum election timeout (ms) |
| `timeout_max_ms` | `integer` | `300` | Maximum election timeout (ms) |
| `heartbeat_interval_ms` | `integer` | `50` | Main to worker heartbeat interval (ms) |
| `phi_suspect` | `float` | `8.0` | Phi accrual suspect threshold |
| `phi_dead` | `float` | `12.0` | Phi accrual dead threshold |

### Cluster Health (`[cluster.health]`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `check_interval_secs` | `integer` | `5` | Health check frequency |
| `max_missed_heartbeats` | `integer` | `3` | Mark peer unhealthy after N misses |

## Complete Default Configuration

For reference, see the [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml) file in the repository.

## Next Steps

- [Configuration Overview](./index) -- How configuration layers work together
- [Cluster Deployment](../cluster/deployment) -- Cluster-specific configuration
- [Rule Engine](../rules/) -- Rule engine settings in detail
