---
title: prx daemon
description: Start the full PRX runtime including gateway, channels, cron scheduler, and self-evolution engine.
---

# prx daemon

Start the full PRX runtime. The daemon process manages all long-running subsystems: the HTTP/WebSocket gateway, messaging channel connections, the cron scheduler, and the self-evolution engine.

## Usage

```bash
prx daemon [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Path to configuration file |
| `--port` | `-p` | `3120` | Gateway listen port |
| `--host` | `-H` | `127.0.0.1` | Gateway bind address |
| `--log-level` | `-l` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | Disable the self-evolution engine |
| `--no-cron` | | `false` | Disable the cron scheduler |
| `--no-gateway` | | `false` | Disable the HTTP/WS gateway |
| `--pid-file` | | | Write PID to the specified file |

## What the Daemon Starts

When launched, `prx daemon` initializes the following subsystems in order:

1. **Configuration loader** -- reads and validates the config file
2. **Memory backend** -- connects to the configured memory store (markdown, SQLite, or PostgreSQL)
3. **Gateway server** -- starts the HTTP/WebSocket server on the configured host and port
4. **Channel manager** -- connects all enabled messaging channels (Telegram, Discord, Slack, etc.)
5. **Cron scheduler** -- loads and activates scheduled tasks
6. **Self-evolution engine** -- starts the L1/L2/L3 evolution pipeline (if enabled)

## Examples

```bash
# Start with default settings
prx daemon

# Bind to all interfaces on port 8080
prx daemon --host 0.0.0.0 --port 8080

# Start with debug logging
prx daemon --log-level debug

# Start without evolution (useful for debugging)
prx daemon --no-evolution

# Use a custom config file
prx daemon --config /etc/prx/production.toml
```

## Signals

The daemon responds to Unix signals for runtime control:

| Signal | Behavior |
|--------|----------|
| `SIGHUP` | Reload configuration file without restarting. Channels and cron tasks are reconciled with the new config. |
| `SIGTERM` | Graceful shutdown. Finishes in-flight requests, disconnects channels cleanly, and flushes pending memory writes. |
| `SIGINT` | Same as `SIGTERM` (Ctrl+C). |

```bash
# Reload config without restart
kill -HUP $(cat /var/run/prx.pid)

# Graceful shutdown
kill -TERM $(cat /var/run/prx.pid)
```

## Running as a systemd Service

The recommended way to run the daemon in production is via systemd. Use [`prx service install`](./service) to generate and install the unit file automatically, or create one manually:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx

# Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# Install and start the service
prx service install
prx service start

# Or manually
sudo systemctl enable --now prx
```

## Logging

The daemon logs to stderr by default. In a systemd environment, logs are captured by the journal:

```bash
# Follow daemon logs
journalctl -u prx -f

# Show logs from the last hour
journalctl -u prx --since "1 hour ago"
```

Set structured JSON logging by adding `log_format = "json"` to the config file for integration with log aggregators.

## Health Check

While the daemon is running, use [`prx doctor`](./doctor) or query the gateway health endpoint:

```bash
# CLI diagnostics
prx doctor

# HTTP health endpoint
curl http://127.0.0.1:3120/health
```

## Related

- [prx gateway](./gateway) -- standalone gateway without channels or cron
- [prx service](./service) -- systemd/OpenRC service management
- [prx doctor](./doctor) -- daemon diagnostics
- [Configuration Overview](/en/prx/config/) -- config file reference
- [Self-Evolution Overview](/en/prx/self-evolution/) -- evolution engine details
