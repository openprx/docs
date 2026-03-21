---
title: Tailscale Funnel
description: Expose your PRX agent to le internet using Tailscale Funnel over your Tailscale mesh network.
---

# Tailscale Funnel

Tailscale Funnel vous permet de expose your local PRX instance vers le public internet through Tailscale's relay infrastructure. Unlike a traditional tunnel that necessite a third-party edge network, Funnel leverages your existing Tailscale mesh -- making it an excellent choice when your PRX nodes already communicate over Tailscale.

## Apercu

Tailscale provides two complementary features for PRX connectivity:

| Feature | Scope | Use Case |
|---------|-------|----------|
| **Tailscale Serve** | Private (tailnet only) | Expose PRX to other devices on your Tailscale network |
| **Tailscale Funnel** | Public (internet) | Expose PRX to external webhooks and services |

PRX utilise Funnel for webhook ingress and Serve for node-to-node communication within a tailnet.

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

Le trafic arrive a votre nom d'hote MagicDNS Tailscale (e.g., `prx-host.tailnet-name.ts.net`), is routed through Tailscale's DERP relay network over WireGuard, and forwarded vers le local PRX gateway.

## Prerequis

1. Tailscale installed and authenticated sur le machine running PRX
2. Tailscale Funnel enabled for your tailnet (requires admin approval)
3. The machine's Tailscale node doit avoir Funnel capability in the ACL policy

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

Funnel doit etre explicitly allowed in your tailnet's ACL policy. Add les elements suivants to your Tailscale ACL file (via the admin console):

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

Cela accorde la capacite Funnel a tous les membres. Pour un controle plus strict, replace `autogroup:member` with specific users or tags:

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

| Parameter | Type | Defaut | Description |
|-----------|------|---------|-------------|
| `funnel` | boolean | `true` | `true` for public Funnel, `false` for tailnet-only Serve |
| `port` | integer | `443` | Public port (Funnel supports 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | Path vers le `tailscale` CLI binary |
| `hostname` | string | auto-detected | Override the MagicDNS hostname |
| `reset_on_stop` | boolean | `true` | Remove the Funnel/Serve configuration when PRX stops |
| `background` | boolean | `true` | Run `tailscale serve` in background mode |

## How PRX Manages Tailscale

Lorsque le tunnel demarre, PRX execute :

```bash
# For Funnel (public)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# For Serve (private)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

The `--bg` flag runs the serve/funnel in the background within the `tailscaled` daemon. PRX n'a pas besoin de keep a processus enfant alive -- `tailscaled` gere le forwarding.

Lorsque PRX stops, it cleans up by running:

```bash
tailscale funnel --https=443 off
# or
tailscale serve --https=443 off
```

This behavior is controle par the `reset_on_stop` parameter.

## Public URL

The public URL for Funnel follows the MagicDNS pattern:

```
https://<machine-name>.<tailnet-name>.ts.net
```

Par exemple, if your machine is named `prx-host` et your tailnet is `example`, l'URL is:

```
https://prx-host.example.ts.net
```

PRX automatiquement detects this hostname by parsing la sortie of `tailscale status --json` and constructs the full public URL.

## Health Checks

PRX surveille the Tailscale tunnel with two checks:

1. **Tailscale daemon status** -- `tailscale status --json` must report the node as connected
2. **Funnel reachability** -- HTTP GET vers le public URL must retour a 2xx response

If health checks fail, PRX attempts to re-establish the Funnel by running the `tailscale funnel` command again. If `tailscaled` itself is down, PRX logs an error et disables the tunnel until le daemon recovers.

## ACL Considerations

Tailscale ACLs control which devices can communicate and which can use Funnel. Key envisagezations for PRX deployments:

### Restricting Funnel to PRX Nondes

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

### Allowing Nonde-to-Nonde Traffic

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

## Depannage

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "Funnel not available" | ACL policy missing funnel attr | Add `funnel` attribute to node or user in ACL |
| "not connected" status | `tailscaled` not running | Start the Tailscale daemon: `sudo tailscale up` |
| Certificate error | DNS not propagated | Wait for MagicDNS propagation (usually < 1 minute) |
| Port already in use | Another Serve/Funnel on same port | Remove existing: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX gateway not listening | Verify `local_addr` matches your gateway's listen address |

## Voir aussi Pages

- [Tunnel Overview](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [Nonde Pairing](/fr/prx/nodes/pairing)
- [Security Overview](/fr/prx/security/)
