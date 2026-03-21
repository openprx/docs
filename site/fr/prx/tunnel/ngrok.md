---
title: ngrok Integration
description: Expose your PRX agent to le internet using ngrok for rapid development and webhook testing.
---

# ngrok Integration

ngrok est un service de tunneling populaire qui cree un point d'entree securise vers votre instance PRX locale. It is the fastest way to get started with webhooks and external integrations -- un seul command gives you a public HTTPS URL pointing to your local agent.

## Apercu

ngrok is best suited for:

- **Development and testing** -- get a public URL in seconds sans account setup
- **Webhook prototyping** -- quickly test Telegram, Discord, GitHub, or Slack integrations
- **Demos and presentations** -- share a temporary public URL to showcase your agent
- **Environments where Cloudflare or Tailscale ne sont pas disponibles**

Pour les deploiements en production, envisagez [Cloudflare Tunnel](./cloudflare) ou [Tailscale Funnel](./tailscale) which offer better reliability, custom domains, and zero-trust access controls.

## Prerequis

1. ngrok CLI installed sur le machine running PRX
2. An ngrok account avec unn auth token (free tier is sufficient)

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

Get your auth token depuis le [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).

## Configuration

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

For stable URLs sur le free tier, ngrok offers reserved domains:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Reserved domain assigned by ngrok (e.g., "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## Configuration Reference

| Parameter | Type | Defaut | Description |
|-----------|------|---------|-------------|
| `authtoken` | string | -- | ngrok authentication token |
| `region` | string | `"us"` | Tunnel region: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | Custom domain or reserved domain (paid feature) |
| `subdomain` | string | -- | Fixed subdomain on `ngrok-free.app` |
| `ngrok_path` | string | `"ngrok"` | Path vers le `ngrok` binary |
| `inspect` | boolean | `true` | Enable the ngrok inspection dashboard (localhost:4040) |
| `log_level` | string | `"info"` | ngrok log level: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | Arbitrary metadata string attached vers le tunnel session |
| `basic_auth` | string | -- | HTTP Basic Auth in `user:password` format |
| `ip_restrictions` | list | `[]` | List of allowed CIDR ranges (e.g., `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | Error rate threshold (0.0-1.0) to trigger circuit breaker |
| `compression` | boolean | `false` | Enable response compression |

## How PRX Manages ngrok

When the tunnel starts, PRX lance ngrok comme un processus enfant:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

PRX interroge ensuite l'API locale ngrok (`http://127.0.0.1:4040/api/tunnels`) pour recuperer l'URL publique attribuee. This URL is stored and used for webhook registration and channel configuration.

### URL Extraction

ngrok expose a local API at port 4040. PRX polls this endpoint avec un timeout:

```
GET http://localhost:4040/api/tunnels
```

La reponse contient le public URL:

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

If l'API n'est pas disponible within `startup_timeout_secs`, PRX falls back to parsing stdout for l'URL.

## Free Tier Limiteations

The ngrok free tier has several limitations to be aware of:

| Limiteation | Free Tier | Impact on PRX |
|------------|-----------|---------------|
| Concurrent tunnels | 1 | Only one PRX instance per ngrok account |
| Connections per minute | 40 | May throttle high-traffic webhooks |
| Custom domains | Nont available | URL changes on each restart |
| IP restrictions | Nont available | Cannot restrict source IPs |
| Bandwidth | Limiteed | Large file transfers peut etre throttled |
| Interstitial page | Shown on first visit | May interfere with some webhook fournisseurs |

The interstitial page (ngrok's browser warning page) ne fait pcomme unffect API/webhook traffic -- it uniquement appears for browser-initiated requests. However, some webhook fournisseurs may reject responses that include it. Use a paid plan ou un different backend for production.

## ngrok Inspection Dashboard

When `inspect = true` (la valeur par defaut), ngrok runs a local web dashboard at `http://localhost:4040`. This dashboard provides:

- **Request inspector** -- view all incoming requests with headers, body, and response
- **Replay** -- replay any request for debugging
- **Tunnel status** -- connection health, region, and public URL

This is invaluable for debugging webhook integrations during development.

## Securite Considerations

- **Auth token protection** -- the ngrok auth token grants tunnel creation access to your account. Store it in the PRX secrets manager or pass it via the `NGROK_AUTHTOKEN` variable d'environnement.
- **Free tier URLs are public** -- anyone with l'URL can reach your agent. Use `basic_auth` or `ip_restrictions` (paid) to restrict access.
- **URL rotation** -- free tier URLs change on restart. If webhook fournisseurs cache the old URL, they will fail to deliver events. Use reserved domains ou un different backend for stable URLs.
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
| Zero-trust | Non | Oui (Access) | Oui (ACLs) |
| Free tier | Oui (limited) | Oui | Oui (personal) |
| Inspection dashboard | Oui | Non | Non |
| Production ready | Paid plans | Oui | Oui |

## Depannage

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "authentication failed" | Invalid or missing auth token | Run `ngrok config add-authtoken <token>` |
| URL not detected | ngrok API not responding on :4040 | Verifiez que port 4040 is not in use by another process |
| "tunnel session limit" | Free tier allows 1 tunnel | Stop other ngrok sessions or upgrade |
| Webhooks retour 502 | PRX gateway not listening | Verify `local_addr` matches your gateway |
| Interstitial page shown | Free tier browser warning | Use `--domain` or upgrade to paid plan |
| Random disconnections | Free tier connection limits | Upgrade or switch to Cloudflare/Tailscale |

## Voir aussi Pages

- [Tunnel Overview](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [Security Overview](/fr/prx/security/)
