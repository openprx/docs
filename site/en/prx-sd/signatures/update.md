---
title: Update Signatures
description: Keep threat intelligence databases current with sd update, downloading the latest YARA rules and hash signatures from GitHub.
---

# Update Signatures

The `sd update` command downloads the latest threat signatures from all configured sources. Regular updates are critical -- new malware samples appear every few minutes, and an outdated signature database leaves gaps in protection.

## Usage

```bash
sd update [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--check-only` | | `false` | Check for available updates without downloading |
| `--force` | `-f` | `false` | Force re-download even if already up to date |
| `--server-url` | | (none) | Use a custom update server instead of GitHub |

## How Updates Work

### Update Flow

```
sd update
  1. Check latest commit on github.com/openprx/prx-sd-signatures (GitHub API)
  2. Compare with locally stored commit SHA
  3. If update available:
     a. Download tarball of main branch
     b. Extract YARA rules → ~/.prx-sd/yara/
     c. Extract IOC blocklists → ~/.prx-sd/ioc/
     d. Import hash files into LMDB database
     e. Store new commit SHA
```

## Checking for Updates

To see what updates are available without downloading:

```bash
sd update --check-only
```

```
>>> Checking for signature updates...
  Source: github.com/openprx/prx-sd-signatures
  Local:  a1b2c3d4e5f6
  Remote: f6e5d4c3b2a1 (2026-03-22T10:30:00Z)
  Commit: Update YARA rules and IOC feeds

UPDATE Update available: a1b2c3d4e5f6 -> f6e5d4c3b2a1
```

## Custom Update Server

For air-gapped environments or organizations running a private mirror:

```bash
# Set a custom update server (for air-gapped environments)
sd config set update_server_url https://signatures.internal.corp/prx-sd/v1

# When configured, sd update uses the legacy manifest-based protocol
sd update

# Reset to GitHub default
sd config set update_server_url null
```

## Shell Script Alternative

For systems where `sd` is not installed, use the bundled shell script:

```bash
# Standard update (hashes + YARA)
./tools/update-signatures.sh

# Full update including VirusShare
./tools/update-signatures.sh --full

# Update only hashes
./tools/update-signatures.sh --source hashes

# Update only YARA rules
./tools/update-signatures.sh --source yara
```

## Examples

```bash
# Standard update
sd update

# Force re-download even if already up to date
sd update --force

# Check what's available first
sd update --check-only

# Use a custom server
sd update --server-url https://mirror.example.com/prx-sd/v1
```

## Automating Updates

### With sd daemon

The daemon handles updates automatically. Configure the interval:

```bash
sd daemon start --update-hours 4
```

### With cron

```bash
# Update signatures every 6 hours
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### With systemd timer

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## Next Steps

- [Signature Sources](./sources) -- details on each threat intelligence source
- [Import Hashes](./import) -- add custom hash blocklists
- [Daemon](../realtime/daemon) -- automatic background updates
- [Threat Intelligence Overview](./index) -- database architecture overview
