---
title: Tunnel & NAT Traversal
description: Overview of the PRX tunneling system for exposing local agent instances to external webhooks, channels, and services.
---

# Tunnel & NAT Traversal

PRX agents often need to receive inbound connections -- webhook callbacks from GitHub, Telegram updates, Slack events, or inter-node communication. When running behind a NAT or firewall, the tunnel subsystem provides automatic ingress by establishing an outbound connection to a tunnel provider and mapping a public URL to your local PRX instance.

## Why Tunneling Matters

Many PRX features require a publicly reachable endpoint:

- **Webhook channels** -- Telegram, Discord, Slack, and GitHub all push events to a URL you provide. Without a public endpoint, these channels cannot deliver messages to your agent.
- **OAuth2 callbacks** -- Provider authentication flows redirect the browser to a local URL. Tunnels make this work even when PRX runs on a private network.
- **Node-to-node communication** -- Distributed PRX deployments need nodes to reach each other. Tunnels bridge nodes across different networks.
- **MCP server hosting** -- When PRX acts as an MCP server for external clients, the tunnel provides the public endpoint.

## Supported Backends

PRX ships with four tunnel backends and a no-op fallback:

| Backend | Provider | Free Tier | Custom Domain | Auth Required | Zero-Trust |
|---------|----------|-----------|---------------|---------------|------------|
| [Cloudflare Tunnel](./cloudflare) | Cloudflare | Yes | Yes (with zone) | Yes (`cloudflared`) | Yes |
| [Tailscale Funnel](./tailscale) | Tailscale | Yes (personal) | Via MagicDNS | Yes (Tailscale account) | Yes |
| [ngrok](./ngrok) | ngrok | Yes (limited) | Yes (paid) | Yes (auth token) | No |
| Custom command | Any | Depends | Depends | Depends | Depends |
| None | -- | -- | -- | -- | -- |

## Architecture

The tunnel subsystem is built around the `Tunnel` trait:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

Each backend implements this trait. The `TunnelProcess` struct manages the underlying child process (e.g., `cloudflared`, `tailscale`, `ngrok`) -- handling spawn, stdout/stderr capture, graceful shutdown, and automatic restart on failure.

```
┌─────────────────────────────────────────────┐
│                PRX Gateway                   │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (local)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (child process)                 │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (outbound TLS)
┌─────────────────▼───────────────────────────┐
│         Tunnel Provider Edge Network         │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## Configuration

Configure the tunnel in `config.toml`:

```toml
[tunnel]
# Backend selection: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Local address that the tunnel will forward traffic to.
# This should match your gateway listen address.
local_addr = "127.0.0.1:8080"

# Health check interval in seconds. The tunnel is restarted if
# the health check fails consecutively for `max_failures` times.
health_check_interval_secs = 30
max_failures = 3

# Auto-detect: if backend = "auto", PRX probes for available
# tunnel binaries in order: cloudflared, tailscale, ngrok.
# Falls back to "none" with a warning if nothing is found.
```

### Backend-Specific Configuration

Each backend has its own configuration section. See the individual backend pages for details:

- [Cloudflare Tunnel](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### Custom Command Backend

For tunnel providers not natively supported, use the `custom` backend:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# The command to run. Must accept traffic on local_addr and print
# the public URL to stdout within startup_timeout_secs.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: regex to extract the public URL from stdout.
# The first capture group is used as the URL.
url_pattern = "listening at (https?://[\\S]+)"
```

## Auto-Detection

When `backend = "auto"`, PRX searches `$PATH` for tunnel binaries in this order:

1. `cloudflared` -- preferred for its zero-trust capabilities
2. `tailscale` -- preferred for private mesh networking
3. `ngrok` -- widely available, easy setup

If none are found, the tunnel is disabled and PRX logs a warning. Webhook-dependent channels will not function without a tunnel or a public IP.

## TunnelProcess Lifecycle

The `TunnelProcess` struct manages the child process lifecycle:

| Phase | Description |
|-------|-------------|
| **Spawn** | Start the tunnel binary with configured arguments |
| **URL extraction** | Parse stdout for the public URL (within `startup_timeout_secs`) |
| **Monitoring** | Periodic health checks via HTTP GET to the public URL |
| **Restart** | If `max_failures` consecutive health checks fail, stop and restart |
| **Shutdown** | Send SIGTERM, wait 5 seconds, then SIGKILL if still running |

## Environment Variables

Tunnel configuration can also be set via environment variables, which take precedence over `config.toml`:

| Variable | Description |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | Override the tunnel backend |
| `PRX_TUNNEL_LOCAL_ADDR` | Override the local forwarding address |
| `PRX_TUNNEL_URL` | Skip tunnel startup entirely and use this URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel token |
| `NGROK_AUTHTOKEN` | ngrok authentication token |

Setting `PRX_TUNNEL_URL` is useful when you already have a reverse proxy or load balancer exposing PRX publicly. The tunnel subsystem will skip process management and use the provided URL directly.

## Security Considerations

- **TLS termination** -- All supported backends terminate TLS at the provider edge. Traffic between the provider and your local PRX instance travels over an encrypted tunnel.
- **Access control** -- Cloudflare and Tailscale support identity-based access policies. Use these when exposing sensitive agent endpoints.
- **Credential storage** -- Tunnel tokens and auth keys are stored in the PRX secrets manager. Never commit them to version control.
- **Process isolation** -- `TunnelProcess` runs as a separate child process. It does not share memory with the PRX agent runtime.

## Troubleshooting

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Tunnel starts but webhooks fail | URL not propagated to channel config | Check that `tunnel.public_url` is being used by the channel |
| Tunnel restarts repeatedly | Health check hitting wrong endpoint | Verify `local_addr` matches your gateway listen address |
| "binary not found" error | Tunnel CLI not installed | Install the appropriate binary (`cloudflared`, `tailscale`, `ngrok`) |
| Timeout during URL extraction | Tunnel binary takes too long to start | Increase `startup_timeout_secs` |

## Related Pages

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Gateway Configuration](/en/prx/gateway)
- [Security Overview](/en/prx/security/)
