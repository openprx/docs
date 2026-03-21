---
title: CrowdSec Integration
description: PRX-WAF CrowdSec integration for collaborative threat intelligence. Bouncer mode with in-memory decision cache, AppSec mode for real-time HTTP analysis, and log pusher for community sharing.
---

# CrowdSec Integration

PRX-WAF integrates with [CrowdSec](https://www.crowdsec.net/) to bring collaborative, community-driven threat intelligence directly into the WAF detection pipeline. Instead of relying solely on local rules and heuristics, PRX-WAF can leverage the CrowdSec network -- where thousands of machines share attack signals in real time -- to block known malicious IPs, detect application-layer attacks, and contribute WAF events back to the community.

The integration operates in **three modes** that can be used independently or together:

| Mode | Purpose | Latency | Pipeline Phase |
|------|---------|---------|----------------|
| **Bouncer** | Block IPs with cached LAPI decisions | Microseconds (in-memory) | Phase 16a |
| **AppSec** | Analyze full HTTP requests via CrowdSec AppSec | Milliseconds (HTTP call) | Phase 16b |
| **Log Pusher** | Report WAF events back to LAPI | Asynchronous (batched) | Background |

## How It Works

### Bouncer Mode

Bouncer mode maintains an **in-memory decision cache** synchronized with the CrowdSec Local API (LAPI). When a request arrives at Phase 16a of the detection pipeline, PRX-WAF performs an O(1) lookup against the cache:

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

The cache is refreshed on a configurable interval (default: every 10 seconds) by polling the LAPI `/v1/decisions` endpoint. This design ensures that IP lookups never block on network I/O -- the synchronization happens in a background task.

**Data structures:**

- **DashMap** for exact IP addresses -- lock-free concurrent hashmap, O(1) lookup
- **RwLock\<Vec\>** for CIDR ranges -- scanned sequentially on cache miss, typically a small set

**Scenario filtering** allows you to include or exclude decisions based on scenario names:

```toml
# Only act on SSH brute-force and HTTP scanning scenarios
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignore decisions from these scenarios
scenarios_not_containing = ["manual"]
```

### AppSec Mode

AppSec mode sends full HTTP request details to the CrowdSec AppSec component for real-time analysis. Unlike Bouncer mode which only checks IPs, AppSec inspects request headers, body, URI, and method to detect application-layer attacks such as SQL injection, XSS, and path traversal.

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

AppSec checks are **asynchronous** -- PRX-WAF sends the request with a configurable timeout (default: 500ms). If the AppSec endpoint is unreachable or times out, the `fallback_action` determines whether to allow, block, or log the request.

### Log Pusher

The log pusher reports WAF security events back to the CrowdSec LAPI, contributing to the community threat intelligence network. Events are batched and flushed periodically to minimize LAPI load.

**Batching parameters:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Batch size | 50 events | Flush when buffer reaches 50 events |
| Flush interval | 30 seconds | Flush even if buffer is not full |
| Authentication | Machine JWT | Uses `pusher_login` / `pusher_password` for machine auth |
| Shutdown | Final flush | All buffered events are flushed before process exit |

The pusher authenticates with the LAPI using machine credentials (separate from the bouncer API key) and posts events to the `/v1/alerts` endpoint.

## Configuration

Add the `[crowdsec]` section to your TOML configuration file:

```toml
[crowdsec]
# Master switch
enabled = true

# Integration mode: "bouncer", "appsec", or "both"
mode = "both"

# --- Bouncer settings ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = use LAPI-provided duration
fallback_action = "allow"    # "allow" | "block" | "log"

# Scenario filtering (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec settings ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log Pusher settings ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### Configuration Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable CrowdSec integration |
| `mode` | `string` | `"bouncer"` | Integration mode: `"bouncer"`, `"appsec"`, or `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI base URL |
| `api_key` | `string` | `""` | Bouncer API key (obtain via `cscli bouncers add`) |
| `update_frequency_secs` | `integer` | `10` | How often to refresh the decision cache from LAPI (seconds) |
| `cache_ttl_secs` | `integer` | `0` | Override decision TTL. `0` means use the duration provided by LAPI. |
| `fallback_action` | `string` | `"allow"` | Action when LAPI or AppSec is unreachable: `"allow"`, `"block"`, or `"log"` |
| `scenarios_containing` | `string[]` | `[]` | Only cache decisions whose scenario name contains one of these substrings. Empty means all. |
| `scenarios_not_containing` | `string[]` | `[]` | Exclude decisions whose scenario name contains one of these substrings. |
| `appsec_endpoint` | `string` | -- | CrowdSec AppSec endpoint URL |
| `appsec_key` | `string` | -- | AppSec API key |
| `appsec_timeout_ms` | `integer` | `500` | AppSec HTTP request timeout (milliseconds) |
| `pusher_login` | `string` | -- | Machine login for LAPI authentication (log pusher) |
| `pusher_password` | `string` | -- | Machine password for LAPI authentication (log pusher) |

## Setup Guide

### Prerequisites

1. A running CrowdSec instance with the LAPI accessible from your PRX-WAF host
2. A bouncer API key (for Bouncer mode)
3. CrowdSec AppSec component (for AppSec mode, optional)
4. Machine credentials (for Log Pusher, optional)

### Step 1: Install CrowdSec

If you don't have CrowdSec installed yet:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Verify LAPI is running
sudo cscli metrics
```

### Step 2: Register a Bouncer

```bash
# Create a bouncer API key for PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Output:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copy this key -- it is only shown once.
```

### Step 3: Configure PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### Step 4: Verify Connectivity

```bash
# Using the CLI
prx-waf crowdsec test

# Or via the API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### Step 5 (Optional): Enable AppSec

If you have the CrowdSec AppSec component running:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### Step 6 (Optional): Enable Log Pusher

To contribute WAF events back to CrowdSec:

```bash
# Register a machine on the CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### Interactive Setup

For a guided setup experience, use the CLI wizard:

```bash
prx-waf crowdsec setup
```

The wizard walks you through LAPI URL configuration, API key input, mode selection, and connectivity testing.

## Pipeline Integration

CrowdSec checks execute at **Phase 16** of the 16-phase WAF detection pipeline -- the final phase before proxying to the upstream backend. This positioning is deliberate:

1. **Cheaper checks first.** IP allowlist/blocklist (Phase 1-4), rate limiting (Phase 5), and pattern matching (Phase 8-13) execute before CrowdSec, filtering out obvious attacks without external lookups.
2. **Bouncer before AppSec.** Phase 16a (Bouncer) runs synchronously with microsecond latency. Only if the IP is not in the decision cache does Phase 16b (AppSec) run, which involves an HTTP round-trip.
3. **Non-blocking architecture.** The decision cache is refreshed in a background task. AppSec calls use async HTTP with a timeout. Neither mode blocks the main proxy thread pool.

```
Phase 1-15 (local checks)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR lookup, ~1-5 us)
              │
              ├── Decision found ──> Block/Captcha/Throttle
              │
              └── No decision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                       │
                                       ├── Block ──> 403 Forbidden
                                       │
                                       └── Allow ──> Proxy to upstream
```

## REST API

All CrowdSec API endpoints require authentication (JWT Bearer token from the admin API).

### Status

```http
GET /api/crowdsec/status
```

Returns the current integration status including connection state, cache statistics, and configuration summary.

**Response:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### List Decisions

```http
GET /api/crowdsec/decisions
```

Returns all cached decisions with their type, scope, value, and expiration.

**Response:**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### Delete Decision

```http
DELETE /api/crowdsec/decisions/:id
```

Removes a decision from both the local cache and the LAPI. Useful for unblocking false positives.

**Example:**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### Test Connectivity

```http
POST /api/crowdsec/test
```

Tests connectivity to the LAPI (and AppSec endpoint if configured). Returns connection status and latency.

**Response:**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### Get Configuration

```http
GET /api/crowdsec/config
```

Returns the current CrowdSec configuration (sensitive fields like `api_key` are masked).

### Update Configuration

```http
PUT /api/crowdsec/config
Content-Type: application/json
```

Updates CrowdSec configuration at runtime. Changes take effect immediately without restart.

**Request body:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_url": "http://127.0.0.1:8080",
  "api_key": "new-api-key",
  "update_frequency_secs": 15,
  "fallback_action": "log"
}
```

### Cache Statistics

```http
GET /api/crowdsec/stats
```

Returns detailed cache statistics including hit/miss rates and decision type breakdown.

**Response:**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

### Recent Events

```http
GET /api/crowdsec/events
```

Returns recent security events triggered by CrowdSec decisions.

**Response:**

```json
{
  "events": [
    {
      "timestamp": "2026-03-21T10:14:22Z",
      "source_ip": "192.168.1.100",
      "action": "ban",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "request_uri": "/wp-login.php",
      "method": "POST"
    }
  ],
  "total": 892
}
```

## CLI Commands

### Status

```bash
prx-waf crowdsec status
```

Displays integration status, LAPI connection state, cache size, and pusher statistics.

**Example output:**

```
CrowdSec Integration Status
============================
  Enabled:        true
  Mode:           both
  LAPI URL:       http://127.0.0.1:8080
  LAPI Connected: true
  Cache:
    Exact IPs:    1,247
    CIDR Ranges:  89
    Last Refresh: 2s ago
  AppSec:
    Endpoint:     http://127.0.0.1:7422
    Connected:    true
  Pusher:
    Authenticated: true
    Events Sent:   4,521
    Buffer:        12 pending
```

### List Decisions

```bash
prx-waf crowdsec decisions
```

Prints a table of all active decisions in the local cache.

### Test Connectivity

```bash
prx-waf crowdsec test
```

Performs a connectivity check against the LAPI and AppSec endpoint, reporting latency and version information.

### Setup Wizard

```bash
prx-waf crowdsec setup
```

An interactive wizard that guides you through:

1. LAPI URL and API key configuration
2. Mode selection (bouncer / appsec / both)
3. AppSec endpoint configuration (if applicable)
4. Log pusher credential setup (optional)
5. Connectivity verification
6. Writing the configuration to the TOML file

## Admin UI

The Vue 3 admin dashboard includes three CrowdSec management views:

### CrowdSec Settings

The **CrowdSecSettings** view (`Settings > CrowdSec`) provides a form to configure all CrowdSec parameters:

- Enable/disable toggle
- Mode selector (bouncer / appsec / both)
- LAPI URL and API key fields
- Cache refresh interval slider
- Fallback action selector
- AppSec endpoint configuration
- Log pusher credentials
- Test connectivity button with real-time feedback

### CrowdSec Decisions

The **CrowdSecDecisions** view (`Security > CrowdSec Decisions`) displays all cached decisions in a sortable, filterable table:

- Decision type badges (ban, captcha, throttle)
- IP/range with geolocation lookup
- Scenario name with documentation link
- Expiration countdown
- One-click delete to unblock IPs

### CrowdSec Statistics

The **CrowdSecStats** view (`Dashboard > CrowdSec`) presents operational metrics:

- Cache hit/miss rate chart (time series)
- Decision type breakdown (pie chart)
- Top blocked scenarios (bar chart)
- Pusher event throughput
- LAPI latency histogram

## Deployment Patterns

### Bouncer-Only (Recommended Starting Point)

The simplest deployment. PRX-WAF polls decisions from a CrowdSec LAPI and blocks known malicious IPs:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

Best for: most deployments, minimal overhead, no additional CrowdSec components needed.

### Full Integration (Bouncer + AppSec + Pusher)

Maximum protection with bidirectional threat intelligence:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

Best for: production environments that want both IP reputation and application-layer inspection, plus community contribution.

### High-Availability with Remote LAPI

When CrowdSec LAPI runs on a dedicated server:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "https://crowdsec.internal:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 5
fallback_action = "allow"  # Don't block if LAPI is unreachable
cache_ttl_secs = 300       # Keep decisions for 5 min even if LAPI goes down
```

Best for: multi-server deployments where CrowdSec LAPI is centralized.

### Strict Security (Block on Failure)

For high-security environments where you prefer to block traffic when threat intelligence is unavailable:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
fallback_action = "block"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 200     # Short timeout, fail fast
```

::: warning
Setting `fallback_action = "block"` means all traffic will be blocked if the LAPI or AppSec endpoint becomes unreachable. Only use this in environments where CrowdSec availability is guaranteed.
:::

## Scenario Filtering

CrowdSec scenarios represent specific attack patterns (e.g., `crowdsecurity/ssh-bf` for SSH brute force, `crowdsecurity/http-bad-user-agent` for malicious user agents). You can filter which scenarios PRX-WAF acts on:

### Include Only Specific Scenarios

```toml
[crowdsec]
# Only block IPs flagged for HTTP-related attacks
scenarios_containing = ["http-"]
```

This is useful when your WAF only handles HTTP traffic and you don't want SSH or SMTP brute-force decisions cluttering the cache.

### Exclude Specific Scenarios

```toml
[crowdsec]
# Block everything except manual decisions
scenarios_not_containing = ["manual"]
```

### Combine Filters

```toml
[crowdsec]
# Only HTTP scenarios, but exclude DDoS (handled by upstream)
scenarios_containing = ["http-"]
scenarios_not_containing = ["http-ddos"]
```

## Troubleshooting

### LAPI Connection Refused

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**Cause:** CrowdSec LAPI is not running or listening on a different address.

**Fix:**
```bash
# Check CrowdSec status
sudo systemctl status crowdsec

# Verify LAPI is listening
sudo ss -tlnp | grep 8080

# Check CrowdSec logs
sudo journalctl -u crowdsec -f
```

### Invalid API Key

```
CrowdSec LAPI returned 403: invalid API key
```

**Cause:** The bouncer API key is incorrect or has been revoked.

**Fix:**
```bash
# List existing bouncers
sudo cscli bouncers list

# Create a new bouncer key
sudo cscli bouncers add prx-waf-bouncer
```

### AppSec Timeout

```
CrowdSec AppSec timeout after 500ms
```

**Cause:** The AppSec endpoint is slow or overloaded.

**Fix:**
- Increase `appsec_timeout_ms` (e.g., to 1000)
- Check AppSec resource usage
- Consider using `mode = "bouncer"` only if AppSec is not critical

### Empty Decision Cache

If `prx-waf crowdsec decisions` shows no entries:

1. Verify LAPI has decisions: `sudo cscli decisions list`
2. Check scenario filtering -- your `scenarios_containing` filter may be too restrictive
3. Verify the bouncer key has read permissions

### Log Pusher Authentication Failure

```
CrowdSec pusher: machine authentication failed
```

**Cause:** Invalid machine credentials.

**Fix:**
```bash
# Verify machine exists
sudo cscli machines list

# Re-register the machine
sudo cscli machines add prx-waf-pusher --password "new-password" --force
```

Update `pusher_login` and `pusher_password` in the configuration accordingly.

## Next Steps

- [Configuration Reference](../configuration/reference) -- Full TOML configuration reference
- [CLI Reference](../cli/) -- All CLI commands including CrowdSec subcommands
- [Rule Engine](../rules/) -- How CrowdSec fits into the detection pipeline
- [Admin UI](../admin-ui/) -- Managing CrowdSec from the dashboard
