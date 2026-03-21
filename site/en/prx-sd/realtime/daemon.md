---
title: Daemon Process
description: Run PRX-SD as a background daemon with automatic signature updates and persistent file monitoring.
---

# Daemon Process

The `sd daemon` command starts PRX-SD as a long-running background process that combines real-time file monitoring with automatic signature updates. This is the recommended way to run PRX-SD on servers and workstations that need continuous protection.

## Usage

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `start` | Start the daemon (default if no subcommand given) |
| `stop` | Stop the running daemon |
| `restart` | Stop and restart the daemon |
| `status` | Show daemon status and statistics |

## Options (start)

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--watch` | `-w` | `/home,/tmp` | Comma-separated paths to monitor |
| `--update-hours` | `-u` | `6` | Automatic signature update interval in hours |
| `--no-update` | | `false` | Disable automatic signature updates |
| `--block` | `-b` | `false` | Enable blocking mode (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | Quarantine threats automatically |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PID file location |
| `--log-file` | | `~/.prx-sd/daemon.log` | Log file location |
| `--log-level` | `-l` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | Path to configuration file |

## What the Daemon Manages

When started, `sd daemon` launches two subsystems:

1. **File Monitor** -- watches the configured paths for file system events and scans new or modified files. Equivalent to running `sd monitor` with the same paths.
2. **Update Scheduler** -- periodically checks for and downloads new threat signatures (hash databases, YARA rules, IOC feeds). Equivalent to running `sd update` at the configured interval.

## Default Monitored Paths

When `--watch` is not specified, the daemon monitors:

| Platform | Default Paths |
|----------|--------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

Override these defaults in the config file or via `--watch`:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## Checking Status

Use `sd daemon status` (or the shorthand `sd status`) to view the daemon state:

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## systemd Integration (Linux)

Create a systemd service for automatic startup:

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
The daemon requires root to use fanotify blocking mode. For non-blocking monitoring, you can run it as an unprivileged user with read access to the watched paths.
:::

## launchd Integration (macOS)

Create a launch daemon plist at `/Library/LaunchDaemons/com.openprx.sd.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## Signals

| Signal | Behavior |
|--------|----------|
| `SIGHUP` | Reload configuration and restart watches without full restart |
| `SIGTERM` | Graceful shutdown -- finish current scan, flush logs |
| `SIGINT` | Same as `SIGTERM` |
| `SIGUSR1` | Trigger an immediate signature update |

```bash
# Force an immediate update
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## Examples

```bash
# Start daemon with defaults
sd daemon start

# Start with custom watch paths and 4-hour update cycle
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# Start with blocking mode and auto-quarantine
sudo sd daemon start --block --auto-quarantine

# Check daemon status
sd status

# Restart the daemon
sd daemon restart

# Stop the daemon
sd daemon stop
```

::: warning
Stopping the daemon disables all real-time protection. File system events that occur while the daemon is stopped will not be retroactively scanned.
:::

## Next Steps

- [File Monitoring](./monitor) -- detailed monitoring configuration
- [Ransomware Protection](./ransomware) -- behavioral ransomware detection
- [Updating Signatures](/en/prx-sd/signatures/update) -- manual signature updates
- [Webhook Alerts](/en/prx-sd/alerts/webhook) -- get notified when threats are found
