---
title: ინსტალაცია
description: OpenPR-Webhook-ის ინსტალაცია source-დან Rust toolchain-ის გამოყენებით.
---

# ინსტალაცია

## წინაპირობები

- Rust-ინსტ-ჯ (edition 2024 ან უახლ)
- მ-OpenPR-ინს, webhook-მ-ებ-ის-ა

## Source-დან Build

საცავის clone-ი და release-რ-ში build:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

ბ-ი `target/release/openpr-webhook`-ში.

## დამ-ები

OpenPR-Webhook შ ძ ბ-ებ-ზე:

| Crate | მ |
|-------|---------|
| `axum` 0.8 | HTTP სერვ-ფრ |
| `tokio` 1 | Async runtime |
| `reqwest` 0.12 | HTTP-კ webhook-გ-ი და callback-ებ-ა |
| `hmac` + `sha2` | HMAC-SHA256 სიგ-ვ |
| `toml` 0.8 | კ-ი-ა |
| `tokio-tungstenite` 0.28 | WebSocket-კ tunnel-რ-ა |
| `tracing` | სტ-ი-ი |

## კ-ფ

`config.toml` ფ-ის შ. სერვ-ი სტ-ზე ამ ფ-ს ტ. სრ-ი სქ-ა [კ-ცნ](../configuration/index.md)-ში.

მ-ი მ:

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

## გ-ა

```bash
# Default: loads config.toml from the current directory
./target/release/openpr-webhook

# Specify a custom config path
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## ლ-ი

ლ-ი `RUST_LOG` გ-ცვ-ით კ. ნ-ი `openpr_webhook=info`.

```bash
# Debug logging
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-level logging (very verbose)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## ჯ-შ

სერვ-ი `GET /health` endpoint-ს გ, სერვ-ის-ა `ok`-ს-ა:

```bash
curl http://localhost:9000/health
# ok
```

## Systemd-სერვ (სუ)

Linux-ი-ა წარ-ი-ები-ა:

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

## შ-ნ

- [სწ-დ](quickstart.md) -- პ-ა-ი ა-ის გ-ა და ბ-ბ-ი ტ
- [კ-ცნ](../configuration/index.md) -- სრ TOML-სქ-ი-ა
