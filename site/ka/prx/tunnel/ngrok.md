---
title: ngrok Integration
description: Expose your PRX agent to the internet using ngrok for rapid development and webhook testing.
---

# ngrok Integration

ngrok is a popular tunneling service that creates secure ingress to your local PRX instance. It is the fastest way to get started with webhooks and external integrations -- a single command gives you a public HTTPS URL pointing to your local agent.

## მიმოხილვა

ngrok is best suited for:

- **Development and testing** -- get a public URL in seconds with no account setup
- **Webhook prototyping** -- quickly test Telegram, Discord, GitHub, or Slack integrations
- **Demos and presentations** -- share a temporary public URL to showcase your agent
- **Environments where Cloudflare or Tailscale are not available**

For production deployments, consider [Cloudflare Tunnel](./cloudflare) or [Tailscale Funnel](./tailscale) which offer better reliability, custom domains, and zero-trust access controls.

## წინაპირობები

1. ngrok CLI installed on the machine running PRX
2. An ngrok account with an auth token (free tier is sufficient)

### Installing ngrok

```bash
# Debian / Ubuntu (via snap)
sudo snap install ngrok

# macOS
brew install ngrok

# Binary download (all platforms)
# https://ngrok.com/download

# Authenticate (one-time setup)
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

Get your auth token from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).

## კონფიგურაცია

### Basic Setup

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# Auth token. Can also be set via NGROK_AUTHTOKEN environment variable.
# If omitted, ngrok uses the token from its local config file.
authtoken = ""

# Region for the tunnel endpoint.
# Options: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### Custom Domain (Paid Plans)

ngrok paid plans support persistent custom domains:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Custom domain (requires ngrok paid plan)
domain = "agent.example.com"

# Alternatively, use a static ngrok subdomain (free on some plans)
# subdomain = "my-prx-agent"
```

### Reserved Domain

For stable URLs on the free tier, ngrok offers reserved domains:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Reserved domain assigned by ngrok (e.g., "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## კონფიგურაციის მითითება

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `authtoken` | string | -- | ngrok authentication token |
| `region` | string | `"us"` | Tunnel region: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | Custom domain or reserved domain (paid feature) |
| `subdomain` | string | -- | Fixed subdomain on `ngrok-free.app` |
| `ngrok_path` | string | `"ngrok"` | Path to the `ngrok` binary |
| `inspect` | boolean | `true` | Enable the ngrok inspection dashboard (localhost:4040) |
| `log_level` | string | `"info"` | ngrok log level: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | Arbitrary metadata string attached to the tunnel session |
| `basic_auth` | string | -- | HTTP Basic Auth in `user:password` format |
| `ip_restrictions` | list | `[]` | List of allowed CIDR ranges (e.g., `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | Error rate threshold (0.0-1.0) to trigger circuit breaker |
| `compression` | boolean | `false` | Enable response compression |

## How PRX Manages ngrok

When the tunnel starts, PRX spawns ngrok as a child process:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

PRX then queries the ngrok local API (`http://127.0.0.1:4040/api/tunnels`) to retrieve the assigned public URL. This URL is stored and used for webhook registration and channel configuration.

### URL Extraction

ngrok exposes a local API at port 4040. PRX polls this endpoint with a timeout:

```
GET http://localhost:4040/api/tunnels
```

The response contains the public URL:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

If the API is not available within `startup_timeout_secs`, PRX falls back to parsing stdout for the URL.

## Free Tier Limitations

The ngrok free tier has several limitations to be aware of:

| Limitation | Free Tier | Impact on PRX |
|------------|-----------|---------------|
| Concurrent tunnels | 1 | Only one PRX instance per ngrok account |
| Connections per minute | 40 | May throttle high-traffic webhooks |
| Custom domains | Not available | URL changes on each restart |
| IP restrictions | Not available | Cannot restrict source IPs |
| Bandwidth | Limited | Large file transfers may be throttled |
| Interstitial page | Shown on first visit | May interfere with some webhook providers |

The interstitial page (ngrok's browser warning page) does not affect API/webhook traffic -- it only appears for browser-initiated requests. However, some webhook providers may reject responses that include it. Use a paid plan or a different backend for production.

## ngrok Inspection Dashboard

When `inspect = true` (the default), ngrok runs a local web dashboard at `http://localhost:4040`. This dashboard provides:

- **Request inspector** -- view all incoming requests with headers, body, and response
- **Replay** -- replay any request for debugging
- **Tunnel status** -- connection health, region, and public URL

This is invaluable for debugging webhook integrations during development.

## Security Considerations

- **Auth token protection** -- the ngrok auth token grants tunnel creation access to your account. Store it in the PRX secrets manager or pass it via the `NGROK_AUTHTOKEN` environment variable.
- **Free tier URLs are public** -- anyone with the URL can reach your agent. Use `basic_auth` or `ip_restrictions` (paid) to restrict access.
- **URL rotation** -- free tier URLs change on restart. If webhook providers cache the old URL, they will fail to deliver events. Use reserved domains or a different backend for stable URLs.
- **TLS termination** -- ngrok terminates TLS at its edge. Traffic between ngrok and your local PRX travels through ngrok's infrastructure.
- **Data inspection** -- ngrok's inspection dashboard shows request/response bodies. Disable it in production with `inspect = false` if sensitive data is transmitted.

## Webhook Integration Pattern

A common pattern for development: start PRX with ngrok, register the webhook URL, and test:

```bash
# 1. Start PRX (tunnel starts automatically)
prx start

# 2. PRX logs the public URL
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. Register the webhook URL with your service
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. Inspect requests at http://localhost:4040
```

## Comparison with Other Backends

| Feature | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|---------|-------|-------------------|------------------|
| Setup time | Seconds | Minutes | Minutes |
| Custom domain | Paid | Free (with zone) | MagicDNS only |
| Zero-trust | No | Yes (Access) | Yes (ACLs) |
| Free tier | Yes (limited) | Yes | Yes (personal) |
| Inspection dashboard | Yes | No | No |
| Production ready | Paid plans | Yes | Yes |

## პრობლემების მოგვარება

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "authentication failed" | Invalid or missing auth token | Run `ngrok config add-authtoken <token>` |
| URL not detected | ngrok API not responding on :4040 | Check that port 4040 is not in use by another process |
| "tunnel session limit" | Free tier allows 1 tunnel | Stop other ngrok sessions or upgrade |
| Webhooks return 502 | PRX gateway not listening | Verify `local_addr` matches your gateway |
| Interstitial page shown | Free tier browser warning | Use `--domain` or upgrade to paid plan |
| Random disconnections | Free tier connection limits | Upgrade or switch to Cloudflare/Tailscale |

## Related Pages

- [Tunnel Overview](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [Security Overview](/ka/prx/security/)
