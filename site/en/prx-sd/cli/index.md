---
title: CLI Command Reference
description: Complete reference for all 27 sd CLI subcommands, organized by category, with global options and quick usage examples.
---

# CLI Command Reference

The `sd` command-line interface provides 27 subcommands organized into 10 categories. This page serves as a quick-reference index. Each command links to its detailed documentation page where available.

## Global Options

These flags can be passed to any subcommand:

| Flag | Default | Description |
|------|---------|-------------|
| `--log-level <LEVEL>` | `warn` | Logging verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | Base data directory for signatures, quarantine, config, and plugins |
| `--help` | -- | Show help for any command or subcommand |
| `--version` | -- | Show the engine version |

```bash
# Enable debug logging
sd --log-level debug scan /tmp

# Use a custom data directory
sd --data-dir /opt/prx-sd scan /home
```

## Scanning

Commands for on-demand file and system scanning.

| Command | Description |
|---------|-------------|
| `sd scan <PATH>` | Scan a file or directory for threats |
| `sd scan-memory` | Scan running process memory (Linux only, requires root) |
| `sd scan-usb [DEVICE]` | Scan USB/removable devices |
| `sd check-rootkit` | Check for rootkit indicators (Linux only) |

```bash
# Scan a directory recursively with auto-quarantine
sd scan /home --auto-quarantine

# Scan with JSON output for automation
sd scan /tmp --json

# Scan with 4 threads and HTML report
sd scan /var --threads 4 --report /tmp/report.html

# Exclude patterns
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# Scan and auto-remediate (kill process, quarantine, clean persistence)
sd scan /tmp --remediate

# Scan process memory
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# Scan USB devices
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# Check for rootkits
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## Real-Time Monitoring

Commands for continuous file system monitoring and background daemon operation.

| Command | Description |
|---------|-------------|
| `sd monitor <PATHS...>` | Start real-time file system monitoring |
| `sd daemon [PATHS...]` | Run as a background daemon with monitoring and auto-updates |

```bash
# Monitor /home and /tmp for changes
sd monitor /home /tmp

# Monitor with block mode (fanotify, requires root)
sudo sd monitor /home --block

# Run as daemon with default paths (/home, /tmp)
sd daemon

# Daemon with custom update interval (every 2 hours)
sd daemon /home /tmp /var --update-hours 2
```

## Quarantine Management

Commands for managing the AES-256-GCM encrypted quarantine vault.

| Command | Description |
|---------|-------------|
| `sd quarantine list` | List all quarantined files |
| `sd quarantine restore <ID>` | Restore a quarantined file to its original location |
| `sd quarantine delete <ID>` | Permanently delete a quarantined file |
| `sd quarantine delete-all` | Permanently delete all quarantined files |
| `sd quarantine stats` | Show quarantine vault statistics |

```bash
# List quarantined files
sd quarantine list

# Restore a file (use first 8 chars of ID)
sd quarantine restore a1b2c3d4

# Restore to an alternate path
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# Delete a specific entry
sd quarantine delete a1b2c3d4

# Delete all entries (with confirmation prompt)
sd quarantine delete-all

# Delete all without confirmation
sd quarantine delete-all --yes

# View quarantine statistics
sd quarantine stats
```

## Signature Management

Commands for updating and importing threat signatures.

| Command | Description |
|---------|-------------|
| `sd update` | Check for and apply signature database updates |
| `sd import <FILE>` | Import hash signatures from a blocklist file |
| `sd import-clamav <FILES...>` | Import ClamAV signature files (.cvd, .hdb, .hsb) |
| `sd info` | Display engine version, signature status, and system info |

```bash
# Update signatures
sd update

# Check for updates without downloading
sd update --check-only

# Force re-download
sd update --force

# Import custom hash file
sd import /path/to/hashes.txt

# Import ClamAV signatures
sd import-clamav main.cvd daily.cvd

# Show engine info
sd info
```

## Configuration

Commands for managing engine configuration and remediation policy.

| Command | Description |
|---------|-------------|
| `sd config show` | Display current configuration |
| `sd config set <KEY> <VALUE>` | Set a configuration value |
| `sd config reset` | Reset configuration to defaults |
| `sd policy show` | Display remediation policy |
| `sd policy set <KEY> <VALUE>` | Set a remediation policy value |
| `sd policy reset` | Reset remediation policy to defaults |

```bash
# Show config
sd config show

# Set scan threads
sd config set scan.threads 8

# Reset to defaults
sd config reset

# Show remediation policy
sd policy show
```

See [Configuration Overview](../configuration/) and [Configuration Reference](../configuration/reference) for details.

## Scheduled Scans

Commands for managing recurring scheduled scans via systemd timers or cron.

| Command | Description |
|---------|-------------|
| `sd schedule add <PATH>` | Register a recurring scheduled scan |
| `sd schedule remove` | Remove the scheduled scan |
| `sd schedule status` | Show current schedule status |

```bash
# Schedule a weekly scan of /home
sd schedule add /home --frequency weekly

# Schedule a daily scan
sd schedule add /var --frequency daily

# Available frequencies: hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# Remove the schedule
sd schedule remove

# Check schedule status
sd schedule status
```

## Alerts & Webhooks

Commands for configuring alert notifications via webhooks and email.

| Command | Description |
|---------|-------------|
| `sd webhook list` | List configured webhook endpoints |
| `sd webhook add <NAME> <URL>` | Add a webhook endpoint |
| `sd webhook remove <NAME>` | Remove a webhook endpoint |
| `sd webhook test` | Send a test alert to all webhooks |
| `sd email-alert configure` | Configure SMTP email alerts |
| `sd email-alert test` | Send a test alert email |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | Send a custom alert email |

```bash
# Add a Slack webhook
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Add a Discord webhook
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# Add a generic webhook
sd webhook add my-webhook https://example.com/webhook

# List all webhooks
sd webhook list

# Test all webhooks
sd webhook test

# Configure email alerts
sd email-alert configure

# Test email alerts
sd email-alert test
```

## Network Protection

Commands for DNS-level ad and malicious domain blocking.

| Command | Description |
|---------|-------------|
| `sd adblock enable` | Enable adblock protection via hosts file |
| `sd adblock disable` | Disable adblock protection |
| `sd adblock sync` | Re-download all filter lists |
| `sd adblock stats` | Show adblock engine statistics |
| `sd adblock check <URL>` | Check if a URL/domain is blocked |
| `sd adblock log` | Show recent blocked entries |
| `sd adblock add <NAME> <URL>` | Add a custom filter list |
| `sd adblock remove <NAME>` | Remove a filter list |
| `sd dns-proxy` | Start local DNS proxy with filtering |

```bash
# Enable adblock
sudo sd adblock enable

# Start DNS proxy
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

See [Adblock](../network/adblock) and [DNS Proxy](../network/dns-proxy) for details.

## Reporting

| Command | Description |
|---------|-------------|
| `sd report <OUTPUT>` | Generate an HTML report from JSON scan results |

```bash
# Scan with JSON output, then generate HTML report
sd scan /home --json > results.json
sd report report.html --input results.json

# Or use the --report flag directly
sd scan /home --report /tmp/scan-report.html
```

## System

Commands for engine maintenance, integration, and self-update.

| Command | Description |
|---------|-------------|
| `sd status` | Show daemon status (running/stopped, PID, threats blocked) |
| `sd install-integration` | Install file manager right-click scan integration |
| `sd self-update` | Check for and apply engine binary updates |

```bash
# Check daemon status
sd status

# Install desktop integration
sd install-integration

# Check for engine updates
sd self-update --check-only

# Apply engine update
sd self-update
```

## Community

Commands for community threat intelligence sharing.

| Command | Description |
|---------|-------------|
| `sd community status` | Show community sharing configuration |
| `sd community enroll` | Enroll this machine with the community API |
| `sd community disable` | Disable community sharing |

```bash
# Check enrollment status
sd community status

# Enroll in community sharing
sd community enroll

# Disable sharing (preserves credentials)
sd community disable
```

## Next Steps

- Start with the [Quick Start Guide](../getting-started/quickstart) to get scanning in 5 minutes
- Explore [Configuration](../configuration/) to customize engine behavior
- Set up [Real-Time Monitoring](../realtime/) for continuous protection
- Learn about the [Detection Engine](../detection/) pipeline
