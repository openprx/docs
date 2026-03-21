---
title: File Monitoring
description: Real-time file system monitoring with sd monitor for detecting threats as they appear on disk.
---

# File Monitoring

The `sd monitor` command watches directories for file system activity and scans new or modified files in real time. This is the primary way to catch malware the moment it lands on disk, before it has a chance to execute.

## Usage

```bash
sd monitor [OPTIONS] [PATHS...]
```

If no paths are specified, `sd monitor` watches the current working directory.

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--recursive` | `-r` | `true` | Watch directories recursively |
| `--block` | `-b` | `false` | Block file execution until scan completes (Linux only) |
| `--daemon` | `-d` | `false` | Run in the background as a daemon process |
| `--pid-file` | | | Write PID to specified file (implies `--daemon`) |
| `--exclude` | `-e` | | Glob patterns to exclude (repeatable) |
| `--log-file` | | | Write log output to file instead of stderr |
| `--auto-quarantine` | `-q` | `false` | Automatically quarantine detected threats |
| `--events` | | all | Comma-separated list of events to watch |
| `--json` | | `false` | Output events as JSON lines |

## Platform Mechanisms

PRX-SD uses the most capable file system API available on each platform:

| Platform | API | Capabilities |
|----------|-----|-------------|
| **Linux** | fanotify (kernel 5.1+) | System-wide monitoring, execute permission control, file descriptor passthrough |
| **Linux (fallback)** | inotify | Per-directory watches, no blocking support |
| **macOS** | FSEvents | Low-latency recursive monitoring, historical event replay |
| **Windows** | ReadDirectoryChangesW | Per-directory async monitoring with completion ports |

::: tip
On Linux, `sd monitor` requires `CAP_SYS_ADMIN` capability (or root) to use fanotify. If unavailable, it automatically falls back to inotify with a warning.
:::

## Monitored Events

The following file system events trigger a scan:

| Event | Description | Platforms |
|-------|-------------|-----------|
| `Create` | A new file is created | All |
| `Modify` | File contents are written | All |
| `CloseWrite` | File closed after writing (avoids partial scans) | Linux |
| `Delete` | A file is removed | All |
| `Rename` | A file is renamed or moved | All |
| `Open` | A file is opened for reading | Linux (fanotify) |
| `Execute` | A file is about to be executed | Linux (fanotify) |

Filter which events trigger scans with `--events`:

```bash
# Only scan on new files and modifications
sd monitor --events Create,CloseWrite /home
```

## Blocking Mode

On Linux with fanotify, `--block` enables `FAN_OPEN_EXEC_PERM` mode. In this mode the kernel pauses process execution until PRX-SD returns a verdict:

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
Blocking mode adds latency to every program launch in the monitored paths. Use it only on high-risk directories like `/tmp` or download folders, not on system-wide paths like `/usr` or `/lib`.
:::

When a threat is detected in blocking mode:

1. The file open/execute is **denied** by the kernel
2. The event is logged with verdict `BLOCKED`
3. If `--auto-quarantine` is set, the file is moved to the quarantine vault

## Daemon Mode

Use `--daemon` to detach the monitor from the terminal:

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

Stop the daemon by sending `SIGTERM`:

```bash
kill $(cat /var/run/sd-monitor.pid)
```

Or use `sd daemon stop` if running through the daemon manager. See [Daemon](./daemon) for details.

## Examples

```bash
# Watch home and tmp directories
sd monitor /home /tmp

# Watch with automatic quarantine
sd monitor --auto-quarantine /home/downloads

# Block-mode on Linux for a sensitive directory
sudo sd monitor --block --auto-quarantine /tmp

# Exclude build artifacts and node_modules
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# Run as daemon with JSON logging
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# Monitor with specific events only
sd monitor --events Create,Modify,Rename /var/www
```

## JSON Output

When `--json` is enabled, each event produces a single JSON line:

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## Next Steps

- [Daemon](./daemon) -- run monitoring as a managed background service
- [Ransomware Protection](./ransomware) -- specialized ransomware behavior detection
- [Quarantine Management](/en/prx-sd/quarantine/) -- manage quarantined files
- [Threat Response](/en/prx-sd/remediation/) -- configure automatic response policies
