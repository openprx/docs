# Installation

## Prerequisites

- Rust toolchain (edition 2021 or later)
- A running OpenPR instance that can send webhook events

## Build from Source

Clone the repository and build in release mode:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

The binary is produced at `target/release/openpr-webhook`.

## Dependencies

OpenPR-Webhook is built on the following core libraries:

| Crate | Purpose |
|-------|---------|
| `axum` 0.8 | HTTP server framework |
| `tokio` 1 | Async runtime |
| `reqwest` 0.12 | HTTP client for webhook forwarding and callbacks |
| `hmac` + `sha2` | HMAC-SHA256 signature verification |
| `toml` 0.8 | Configuration parsing |
| `tokio-tungstenite` 0.28 | WebSocket client for tunnel mode |
| `tracing` | Structured logging |

## Configuration File

Create a `config.toml` file. The service loads this file at startup. See [Configuration Reference](../configuration/index.md) for the full schema.

Minimal example:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## Running

```bash
# Default: loads config.toml from the current directory
./target/release/openpr-webhook

# Specify a custom config path
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## Logging

Logging is controlled by the `RUST_LOG` environment variable. The default level is `openpr_webhook=info`.

```bash
# Debug logging
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-level logging (very verbose)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## Health Check

The service exposes a `GET /health` endpoint that returns `ok` when the server is running:

```bash
curl http://localhost:9000/health
# ok
```

## Systemd Service (Optional)

For production deployments on Linux:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## Next Steps

- [Quick Start](quickstart.md) -- set up your first agent and test it end-to-end
- [Configuration Reference](../configuration/index.md) -- full TOML schema documentation
