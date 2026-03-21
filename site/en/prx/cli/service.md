---
title: prx service
description: Install and manage PRX as a system service (systemd or OpenRC).
---

# prx service

Install, start, stop, and check the status of PRX as a system service. Supports both systemd (most Linux distributions) and OpenRC (Alpine, Gentoo).

## Usage

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx service install`

Generate and install a service unit file for the current init system.

```bash
prx service install [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Config file path for the service |
| `--user` | `-u` | current user | User to run the service as |
| `--group` | `-g` | current group | Group to run the service as |
| `--bin-path` | | auto-detected | Path to the `prx` binary |
| `--enable` | | `false` | Enable the service to start on boot |
| `--user-service` | | `false` | Install as a user-level systemd service (no sudo required) |

```bash
# Install as a system service (requires sudo)
sudo prx service install --user prx --group prx --enable

# Install as a user service (no sudo)
prx service install --user-service --enable

# Install with a custom config path
sudo prx service install --config /etc/prx/config.toml --user prx
```

The install command:

1. Detects the init system (systemd or OpenRC)
2. Generates the appropriate service file
3. Installs it to the correct location (`/etc/systemd/system/prx.service` or `/etc/init.d/prx`)
4. Optionally enables the service for boot

### `prx service start`

Start the PRX service.

```bash
prx service start
```

```bash
# System service
sudo prx service start

# User service
prx service start
```

### `prx service stop`

Stop the PRX service gracefully.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

Show the current service status.

```bash
prx service status [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | Output as JSON |

**Example output:**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## Generated Unit Files

### systemd

The generated systemd unit file includes production-hardening directives:

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
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## User-Level Service

For single-user deployments, install as a systemd user service. This does not require root privileges:

```bash
prx service install --user-service --enable

# Manage with systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## Related

- [prx daemon](./daemon) -- daemon configuration and signals
- [prx doctor](./doctor) -- verify service health
- [Configuration Overview](/en/prx/config/) -- config file reference
