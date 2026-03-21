---
title: Admin UI
description: PRX-WAF Vue 3 admin dashboard. JWT + TOTP authentication, host management, rule management, security event monitoring, real-time WebSocket dashboard, and notification configuration.
---

# Admin UI

PRX-WAF includes a Vue 3 + Tailwind CSS admin dashboard embedded in the binary. It provides a graphical interface for managing hosts, rules, certificates, security events, and cluster status.

## Accessing the Admin UI

The admin UI is served by the API server on the configured address:

```
http://localhost:9527
```

Default credentials: `admin` / `admin`

::: warning
Change the default password immediately after first login. Enable TOTP two-factor authentication for production environments.
:::

## Authentication

The admin UI supports two authentication mechanisms:

| Method | Description |
|--------|-------------|
| JWT Token | Obtained via `/api/auth/login`, stored in browser localStorage |
| TOTP (Optional) | Time-based One-Time Password for two-factor authentication |

### Login API

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Response:

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

For TOTP-enabled accounts, include the `totp_code` field:

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## Dashboard Sections

### Hosts

Manage protected domains and their upstream backends:
- Add, edit, and delete hosts
- Toggle WAF protection per host
- View traffic statistics per host

### Rules

Manage detection rules across all sources:
- View OWASP CRS, ModSecurity, CVE, and custom rules
- Enable/disable individual rules
- Search and filter by category, severity, and source
- Import and export rules

### IP Rules

Manage IP-based allow and block lists:
- Add IP addresses or CIDR ranges
- Set allow/block actions
- View active IP rules

### URL Rules

Manage URL-based detection rules:
- Add URL patterns with regex support
- Set block/log/allow actions

### Security Events

View and analyze detected attacks:
- Real-time event feed
- Filter by host, attack type, source IP, and time range
- Export events as JSON or CSV

### Statistics

View traffic and security metrics:
- Requests per second
- Attack distribution by type
- Top attacked hosts
- Top source IPs
- Response code distribution

### SSL Certificates

Manage TLS certificates:
- View active certificates and expiration dates
- Upload manual certificates
- Monitor Let's Encrypt auto-renewal status

### WASM Plugins

Manage WebAssembly plugins:
- Upload new plugins
- View loaded plugins and their status
- Enable/disable plugins

### Tunnels

Manage reverse tunnels:
- Create and delete WebSocket-based tunnels
- Monitor tunnel status and traffic

### CrowdSec

View CrowdSec integration status:
- Active decisions from LAPI
- AppSec inspection results
- Connection status

### Notifications

Configure alert channels:
- Email (SMTP)
- Webhook
- Telegram

## Real-Time Monitoring

The admin UI connects to a WebSocket endpoint (`/ws/events`) for live security event streaming. Events appear in real-time as attacks are detected and blocked.

You can also connect to the WebSocket programmatically:

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Security event:", data);
};
```

## Security Hardening

### Restrict Admin Access by IP

Limit admin UI and API access to trusted networks:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### Enable Rate Limiting

Protect the admin API from brute-force attacks:

```toml
[security]
api_rate_limit_rps = 100
```

### Configure CORS

Restrict which origins can access the admin API:

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vue 3 + Tailwind CSS |
| Build | Vite |
| State | Pinia |
| HTTP Client | Axios |
| Charts | Chart.js |
| Embedding | Static files served by Axum |

The admin UI source code is located at `web/admin-ui/` in the repository.

## Next Steps

- [Quick Start](../getting-started/quickstart) -- Set up your first protected host
- [Configuration Reference](../configuration/reference) -- Admin security settings
- [CLI Reference](../cli/) -- Alternative command-line management
