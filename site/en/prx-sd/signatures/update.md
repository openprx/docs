---
title: Update Signatures
description: Keep threat intelligence databases current with sd update, including incremental updates and Ed25519 verification.
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
| `--force` | `-f` | `false` | Force re-download of all signatures, ignoring cache |
| `--source` | `-s` | all | Update only a specific source category: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | Include large datasets (VirusShare 20M+ MD5 hashes) |
| `--server-url` | | official | Custom update server URL |
| `--no-verify` | | `false` | Skip Ed25519 signature verification (not recommended) |
| `--timeout` | `-t` | `300` | Download timeout per source in seconds |
| `--parallel` | `-p` | `4` | Number of parallel downloads |
| `--quiet` | `-q` | `false` | Suppress progress output |

## How Updates Work

### Update Flow

```
sd update
  1. Fetch metadata.json from update server
  2. Compare local versions with remote versions
  3. For each outdated source:
     a. Download incremental diff (or full file if no diff available)
     b. Verify Ed25519 signature
     c. Apply to local database
  4. Recompile YARA rules
  5. Update local metadata.json
```

### Incremental Updates

PRX-SD uses incremental updates to minimize bandwidth:

| Source Type | Update Method | Typical Size |
|-------------|--------------|-------------|
| Hash databases | Delta diff (additions + removals) | 50-200 KB |
| YARA rules | Git-style patches | 10-50 KB |
| IOC feeds | Full replacement (small files) | 1-5 MB |
| ClamAV | cdiff incremental updates | 100-500 KB |

When incremental updates are unavailable (first install, corruption, or `--force`), full databases are downloaded.

### Ed25519 Signature Verification

Every downloaded file is verified against an Ed25519 signature before being applied. This protects against:

- **Tampering** -- modified files are rejected
- **Corruption** -- incomplete downloads are detected
- **Replay attacks** -- old signatures cannot be replayed (timestamp validation)

The signing public key is embedded in the `sd` binary at compile time.

::: warning
Never use `--no-verify` in production. Signature verification exists to prevent supply chain attacks through compromised update servers or man-in-the-middle attacks.
:::

## Checking for Updates

To see what updates are available without downloading:

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## Custom Update Server

For air-gapped environments or organizations running a private mirror:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

Set the server permanently in `config.toml`:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
Use the `prx-sd-mirror` tool to set up a local signature mirror. See the [self-hosting guide](https://github.com/OpenPRX/prx-sd-signatures) for details.
:::

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

# Force full re-download of everything
sd update --force

# Update only YARA rules
sd update --source yara

# Full update with VirusShare (large download)
sd update --full

# Quiet mode for cron jobs
sd update --quiet

# Check what's available first
sd update --check-only

# Use a custom server with increased parallelism
sd update --server-url https://mirror.example.com --parallel 8
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
