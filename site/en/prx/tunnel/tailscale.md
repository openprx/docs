---
title: Tailscale Funnel
description: Expose your PRX agent to the internet using Tailscale Funnel over your Tailscale mesh network.
---

# Tailscale Funnel

Tailscale Funnel allows you to expose your local PRX instance to the public internet through Tailscale's relay infrastructure. Unlike a traditional tunnel that requires a third-party edge network, Funnel leverages your existing Tailscale mesh -- making it an excellent choice when your PRX nodes already communicate over Tailscale.

## Overview

Tailscale provides two complementary features for PRX connectivity:

| Feature | Scope | Use Case |
|---------|-------|----------|
| **Tailscale Serve** | Private (tailnet only) | Expose PRX to other devices on your Tailscale network |
| **Tailscale Funnel** | Public (internet) | Expose PRX to external webhooks and services |

PRX uses Funnel for webhook ingress and Serve for node-to-node communication within a tailnet.

### How Funnel Works

```
External Service (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (your machine)      │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

Traffic arrives at your Tailscale MagicDNS hostname (e.g., `prx-host.tailnet-name.ts.net`), is routed through Tailscale's DERP relay network over WireGuard, and forwarded to the local PRX gateway.

## Prerequisites

1. Tailscale installed and authenticated on the machine running PRX
2. Tailscale Funnel enabled for your tailnet (requires admin approval)
3. The machine's Tailscale node must have Funnel capability in the ACL policy

### Installing Tailscale

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authenticate
sudo tailscale up
```

### Enabling Funnel in ACL Policy

Funnel must be explicitly allowed in your tailnet's ACL policy. Add the following to your Tailscale ACL file (via the admin console):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

This grants Funnel capability to all members. For tighter control, replace `autogroup:member` with specific users or tags:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## Configuration

### Basic Funnel Setup

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exposes the service to the public internet.
# Set to false to use Serve (tailnet-only access).
funnel = true

# Port to expose via Funnel. Tailscale Funnel supports
# ports 443, 8443, and 10000.
port = 443

# HTTPS is mandatory for Funnel. Tailscale provisions
# a certificate automatically via Let's Encrypt.
```

### Tailnet-Only (Serve) Setup

For private node-to-node communication without public exposure:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## Configuration Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `funnel` | boolean | `true` | `true` for public Funnel, `false` for tailnet-only Serve |
| `port` | integer | `443` | Public port (Funnel supports 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | Path to the `tailscale` CLI binary |
| `hostname` | string | auto-detected | Override the MagicDNS hostname |
| `reset_on_stop` | boolean | `true` | Remove the Funnel/Serve configuration when PRX stops |
| `background` | boolean | `true` | Run `tailscale serve` in background mode |

## How PRX Manages Tailscale

When the tunnel starts, PRX executes:

```bash
# For Funnel (public)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# For Serve (private)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

The `--bg` flag runs the serve/funnel in the background within the `tailscaled` daemon. PRX does not need to keep a child process alive -- `tailscaled` handles the forwarding.

When PRX stops, it cleans up by running:

```bash
tailscale funnel --https=443 off
# or
tailscale serve --https=443 off
```

This behavior is controlled by the `reset_on_stop` parameter.

## Public URL

The public URL for Funnel follows the MagicDNS pattern:

```
https://<machine-name>.<tailnet-name>.ts.net
```

For example, if your machine is named `prx-host` and your tailnet is `example`, the URL is:

```
https://prx-host.example.ts.net
```

PRX automatically detects this hostname by parsing the output of `tailscale status --json` and constructs the full public URL.

## Health Checks

PRX monitors the Tailscale tunnel with two checks:

1. **Tailscale daemon status** -- `tailscale status --json` must report the node as connected
2. **Funnel reachability** -- HTTP GET to the public URL must return a 2xx response

If health checks fail, PRX attempts to re-establish the Funnel by running the `tailscale funnel` command again. If `tailscaled` itself is down, PRX logs an error and disables the tunnel until the daemon recovers.

## ACL Considerations

Tailscale ACLs control which devices can communicate and which can use Funnel. Key considerations for PRX deployments:

### Restricting Funnel to PRX Nodes

Tag your PRX machines and restrict Funnel access:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### Allowing Node-to-Node Traffic

For distributed PRX deployments, allow traffic between PRX nodes:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## Troubleshooting

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "Funnel not available" | ACL policy missing funnel attr | Add `funnel` attribute to node or user in ACL |
| "not connected" status | `tailscaled` not running | Start the Tailscale daemon: `sudo tailscale up` |
| Certificate error | DNS not propagated | Wait for MagicDNS propagation (usually < 1 minute) |
| Port already in use | Another Serve/Funnel on same port | Remove existing: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX gateway not listening | Verify `local_addr` matches your gateway's listen address |

## Related Pages

- [Tunnel Overview](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [Node Pairing](/en/prx/nodes/pairing)
- [Security Overview](/en/prx/security/)
