---
title: Cloudflare გვირაბი
description: Integrate PRX with Cloudflare Tunnel for zero-trust ingress using cloudflared.
---

# Cloudflare Tunnel

Cloudflare Tunnel (formerly Argo Tunnel) creates an encrypted, outbound-only connection from your PRX instance to Cloudflare's edge network. No public IP, open firewall ports, or port forwarding required. Cloudflare terminates TLS and routes traffic to your local agent through the tunnel.

## მიმოხილვა

Cloudflare Tunnel is the recommended backend for production PRX deployments because it provides:

- **Zero-trust access** -- integrate with Cloudflare Access to require identity verification before reaching your agent
- **Custom domains** -- use your own domain with automatic HTTPS certificates
- **DDoS protection** -- traffic passes through Cloudflare's network, shielding your origin
- **High reliability** -- Cloudflare maintains multiple edge connections for redundancy
- **Free tier** -- Cloudflare Tunnels are available on the free plan

## წინაპირობები

1. A Cloudflare account (free tier is sufficient)
2. `cloudflared` CLI installed on the machine running PRX
3. A domain added to your Cloudflare account (for named tunnels)

### Installing cloudflared

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary download (all platforms)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## კონფიგურაცია

### Quick Tunnel (No Domain Required)

The simplest setup uses Cloudflare's quick tunnel, which assigns a random `*.trycloudflare.com` subdomain. No Cloudflare account configuration is needed beyond installing `cloudflared`:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick tunnel mode: no token, no named tunnel.
# A random trycloudflare.com URL is assigned on each start.
mode = "quick"
```

Quick tunnels are ideal for development and testing. The URL changes on each restart, so you will need to update webhook registrations accordingly.

### Named Tunnel (Persistent Domain)

For production, use a named tunnel with a stable hostname:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# The tunnel token obtained from `cloudflared tunnel create`.
# Can also be set via CLOUDFLARE_TUNNEL_TOKEN environment variable.
token = "eyJhIjoiNjY..."

# The public hostname that routes to this tunnel.
# Must be configured in the Cloudflare dashboard or via cloudflared CLI.
hostname = "agent.example.com"
```

### Creating a Named Tunnel

```bash
# 1. Authenticate cloudflared with your Cloudflare account
cloudflared tunnel login

# 2. Create a named tunnel
cloudflared tunnel create prx-agent
# Output: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. Create a DNS record pointing to the tunnel
cloudflared tunnel route dns prx-agent agent.example.com

# 4. Get the tunnel token (for config.toml)
cloudflared tunnel token prx-agent
# Output: eyJhIjoiNjY...
```

## კონფიგურაციის მითითება

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | `"quick"` | `"quick"` for random URLs, `"named"` for persistent hostnames |
| `token` | string | -- | Named tunnel token (required for `mode = "named"`) |
| `hostname` | string | -- | Public hostname for named tunnel |
| `cloudflared_path` | string | `"cloudflared"` | Path to the `cloudflared` binary |
| `protocol` | string | `"auto"` | Transport protocol: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | IP version for edge connections: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | Number of connection retries before giving up |
| `grace_period_secs` | integer | `30` | Seconds to wait before shutting down active connections |
| `metrics_port` | integer | -- | If set, expose `cloudflared` metrics on this port |
| `log_level` | string | `"info"` | `cloudflared` log level: `"debug"`, `"info"`, `"warn"`, `"error"` |

## Zero-Trust Access

Cloudflare Access adds an identity layer in front of your tunnel. Users must authenticate (via SSO, email OTP, or service tokens) before reaching your PRX instance.

### Setting Up Access Policies

1. Navigate to Cloudflare Zero Trust dashboard
2. Create an Access Application for your tunnel hostname
3. Add an Access Policy with the desired identity requirements

```
Cloudflare Access Policy Example:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

Service tokens are useful for automated webhook senders (GitHub, Slack) that cannot perform interactive authentication. Configure the token in your webhook provider's headers:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## Health Checks

PRX monitors the Cloudflare Tunnel health by:

1. Checking that the `cloudflared` child process is running
2. Sending an HTTP GET to the public URL and verifying a 2xx response
3. Parsing `cloudflared` metrics (if `metrics_port` is configured) for connection status

If the tunnel becomes unhealthy, PRX logs a warning and attempts to restart `cloudflared`. The restart follows an exponential backoff strategy: 5s, 10s, 20s, 40s, up to a maximum of 5 minutes between attempts.

## Logs and Debugging

`cloudflared` stdout and stderr are captured by `TunnelProcess` and written to the PRX log at `DEBUG` level. To increase verbosity:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

Common log messages and their meanings:

| Log Message | Meaning |
|-------------|---------|
| `Connection registered` | Tunnel established to Cloudflare edge |
| `Retrying connection` | Edge connection dropped, attempting reconnect |
| `Serve tunnel error` | Fatal error, tunnel will restart |
| `Registered DNS record` | DNS route successfully created |

## Example: Full Production Setup

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# Set the token via environment variable
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# Start PRX -- tunnel starts automatically
prx start
```

## Security Notes

- The tunnel token grants full access to the named tunnel. Store it in the PRX secrets manager or pass it via environment variable. Never commit it to version control.
- Quick tunnels do not support Access policies. Use named tunnels for production.
- `cloudflared` runs as a child process with the same user permissions as PRX. Consider running PRX under a dedicated service account with minimal privileges.
- All traffic between `cloudflared` and Cloudflare's edge is encrypted with TLS 1.3 or QUIC.

## Related Pages

- [Tunnel Overview](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Security Overview](/ka/prx/security/)
- [Secrets Management](/ka/prx/security/secrets)
