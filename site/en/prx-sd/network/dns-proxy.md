---
title: DNS Proxy
description: Run a local DNS proxy that combines adblock filtering, IOC domain feeds, and custom blocklists into a single resolver with full query logging.
---

# DNS Proxy

The `sd dns-proxy` command starts a local DNS proxy server that intercepts DNS queries and filters them through three engines before forwarding to an upstream resolver:

1. **Adblock engine** -- blocks ads, trackers, and malicious domains from filter lists
2. **IOC domain feed** -- blocks domains from threat intelligence indicators of compromise
3. **Custom DNS blocklist** -- blocks domains from user-defined lists

Queries that match any filter are answered with `0.0.0.0` (NXDOMAIN). All other queries are forwarded to the configured upstream DNS server. Every query and its resolution status is logged to a JSONL file.

## Quick Start

```bash
# Start the DNS proxy with defaults (listen 127.0.0.1:53, upstream 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
The proxy listens on port 53 by default, which requires root privileges. For unprivileged testing, use a high port like `--listen 127.0.0.1:5353`.
:::

## Command Options

```bash
sd dns-proxy [OPTIONS]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | Address and port to listen on |
| `--upstream` | `8.8.8.8:53` | Upstream DNS server to forward non-blocked queries to |
| `--log-path` | `/tmp/prx-sd-dns.log` | Path for the JSONL query log file |

## Usage Examples

### Basic Usage

Start the proxy on the default address with Google DNS as upstream:

```bash
sudo sd dns-proxy
```

Output:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### Custom Listen Address and Upstream

Use Cloudflare DNS as upstream and listen on a custom port:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### Custom Log Path

Write query logs to a specific location:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Combining with Adblock

The DNS proxy automatically loads adblock filter lists from `~/.prx-sd/adblock/`. To get the best coverage:

```bash
# Step 1: Enable and sync adblock lists
sudo sd adblock enable
sd adblock sync

# Step 2: Start the DNS proxy (it picks up adblock rules automatically)
sudo sd dns-proxy
```

The proxy reads the same cached filter lists used by `sd adblock`. Any lists added via `sd adblock add` are automatically available to the proxy after restarting it.

## Configuring Your System to Use the Proxy

### Linux (systemd-resolved)

Edit `/etc/systemd/resolved.conf`:

```ini
[Resolve]
DNS=127.0.0.1
```

Then restart:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

To revert:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
Redirecting all DNS traffic to the local proxy means that if the proxy is stopped, DNS resolution will fail until you restore the original settings or restart the proxy.
:::

## Log Format

The DNS proxy writes JSONL (one JSON object per line) to the configured log path. Each entry contains:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp of the query |
| `query` | The queried domain name |
| `type` | DNS record type (A, AAAA, CNAME, etc.) |
| `action` | `blocked` or `forwarded` |
| `filter` | Which filter matched: `adblock`, `ioc`, `blocklist`, or `null` |
| `upstream_ms` | Round-trip time to upstream DNS (null if blocked) |

## Architecture

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## Running as a Service

To run the DNS proxy as a persistent systemd service:

```bash
# Create a systemd unit file
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
For a fully managed background experience, consider using `sd daemon` instead, which combines real-time file monitoring, automatic signature updates, and can be extended to include DNS proxy functionality.
:::

## Next Steps

- Configure [Adblock filter lists](./adblock) for comprehensive domain blocking
- Set up [Real-Time Monitoring](../realtime/) for file system protection alongside DNS filtering
- Review the [Configuration Reference](../configuration/reference) for proxy-related settings
