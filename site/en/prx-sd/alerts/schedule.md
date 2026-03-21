---
title: Scheduled Scans
description: Set up recurring scan jobs with sd schedule for automated threat detection at regular intervals.
---

# Scheduled Scans

The `sd schedule` command manages recurring scan jobs that run at defined intervals. Scheduled scans complement real-time monitoring by performing periodic full scans of specified directories, catching threats that may have been missed or introduced while monitoring was inactive.

## Usage

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `add` | Create a new scheduled scan job |
| `remove` | Remove a scheduled scan job |
| `list` | List all scheduled scan jobs |
| `status` | Show status of scheduled jobs including last run and next run |
| `run` | Manually trigger a scheduled job immediately |

## Adding a Scheduled Scan

```bash
sd schedule add <PATH> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--frequency` | `-f` | `daily` | Scan frequency: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | auto-generated | Human-readable name for this job |
| `--recursive` | `-r` | `true` | Scan directories recursively |
| `--auto-quarantine` | `-q` | `false` | Quarantine detected threats |
| `--exclude` | `-e` | | Glob patterns to exclude (repeatable) |
| `--notify` | | `true` | Send alerts on detection |
| `--time` | `-t` | random | Preferred start time (HH:MM, 24-hour format) |
| `--day` | `-d` | `monday` | Day of week for weekly scans |

### Frequency Options

| Frequency | Interval | Use Case |
|-----------|----------|----------|
| `hourly` | Every 60 minutes | High-risk directories (uploads, temp) |
| `4h` | Every 4 hours | Shared directories, web roots |
| `12h` | Every 12 hours | User home directories |
| `daily` | Every 24 hours | General-purpose full scans |
| `weekly` | Every 7 days | Low-risk archives, backup verification |

### Examples

```bash
# Daily scan of home directories
sd schedule add /home --frequency daily --name "home-daily"

# Hourly scan of upload directory with auto-quarantine
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Weekly full scan excluding large media files
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 4-hour scan of temp directories
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Daily scan at a specific time
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Weekly scan on Sunday
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## Listing Scheduled Scans

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## Checking Job Status

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

Get detailed status for a specific job:

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## Removing Scheduled Scans

```bash
# Remove by name
sd schedule remove home-daily

# Remove all scheduled scans
sd schedule remove --all
```

## Manually Triggering a Scan

Run a scheduled job immediately without waiting for the next interval:

```bash
sd schedule run home-daily
```

This executes the scan with all configured options (quarantine, excludes, notifications) and updates the job's last-run timestamp.

## How Scheduling Works

PRX-SD uses an internal scheduler, not system cron. The scheduler runs as part of the daemon process:

```
sd daemon start
  └── Scheduler thread
        ├── Check job intervals every 60 seconds
        ├── Launch scan jobs when interval elapsed
        ├── Serialize results to ~/.prx-sd/schedule/
        └── Send notifications on completion
```

::: warning
Scheduled scans only run when the daemon is active. If the daemon is stopped, missed scans will run at the next daemon start. Use `sd daemon start` to ensure continuous scheduling.
:::

## Configuration File

Scheduled jobs are persisted in `~/.prx-sd/schedule.json` and can also be defined in `config.toml`:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## Scan Reports

Each scheduled scan generates a report stored at `~/.prx-sd/reports/`:

```bash
# View the latest report for a job
sd schedule report home-daily

# Export report as JSON
sd schedule report home-daily --json > report.json

# List all reports
sd schedule report --list
```

::: tip
Combine scheduled scans with email alerts to receive automatic reports. Configure `scan_completed` in the email events to get a summary after each scheduled scan.
:::

## Next Steps

- [Webhook Alerts](./webhook) -- get notified when scheduled scans find threats
- [Email Alerts](./email) -- email reports from scheduled scans
- [Daemon](/en/prx-sd/realtime/daemon) -- required for scheduled scan execution
- [Threat Response](/en/prx-sd/remediation/) -- configure what happens when threats are found
