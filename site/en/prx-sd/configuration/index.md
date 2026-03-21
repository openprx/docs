---
title: Configuration Overview
description: Understand how PRX-SD configuration works, where config files are stored, and how to view, modify, and reset settings using the sd config command.
---

# Configuration Overview

PRX-SD stores all configuration in a single JSON file at `~/.prx-sd/config.json`. This file is created automatically on first run with sensible defaults. You can view, modify, and reset configuration using the `sd config` command or by editing the JSON file directly.

## Configuration File Location

| Platform | Default Path |
|----------|-------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| Custom | `--data-dir /path/to/dir` (global CLI flag) |

The `--data-dir` global flag overrides the default location. When set, the config file is read from `<data-dir>/config.json`.

```bash
# Use a custom data directory
sd --data-dir /opt/prx-sd config show
```

## The `sd config` Command

### Show Current Configuration

Display all current settings, including the config file path:

```bash
sd config show
```

Output:

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### Set a Configuration Value

Set any configuration key using dot-separated notation. Values are automatically parsed as the appropriate JSON type (boolean, integer, float, array, object, or string).

```bash
sd config set <key> <value>
```

Examples:

```bash
# Set maximum file size to 200 MiB
sd config set scan.max_file_size 209715200

# Set scan threads to 8
sd config set scan.threads 8

# Enable auto-quarantine
sd config set quarantine.auto_quarantine true

# Set heuristic threshold to 50 (more sensitive)
sd config set scan.heuristic_threshold 50

# Add exclude paths as a JSON array
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# Change the update server URL
sd config set update_server_url "https://custom-update.example.com/v1"
```

Output:

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
Nested keys use dot notation. For example, `scan.max_file_size` navigates into the `scan` object and sets the `max_file_size` field. Intermediate objects are created automatically if they do not exist.
:::

### Reset to Defaults

Restore all configuration to factory defaults:

```bash
sd config reset
```

Output:

```
OK Configuration reset to defaults.
```

::: warning
Resetting configuration does not delete signature databases, YARA rules, or quarantined files. It only resets the `config.json` file to default values.
:::

## Configuration Categories

The configuration is organized into four main sections:

| Section | Purpose |
|---------|---------|
| `scan.*` | File scanning behavior: file size limits, threads, timeouts, archives, heuristics |
| `monitor.*` | Real-time monitoring: block mode, event channel capacity |
| `quarantine.*` | Quarantine vault: auto-quarantine, maximum vault size |
| `update_server_url` | Signature update server endpoint |

For a complete reference of every configuration key, its type, default value, and description, see the [Configuration Reference](./reference).

## Default Configuration

On first run, PRX-SD generates the following default configuration:

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

Key defaults:

- **Maximum file size:** 100 MiB (files larger than this are skipped)
- **Threads:** `null` (auto-detect based on CPU count)
- **Timeout:** 30 seconds per file
- **Archives:** Scanned, up to 3 levels of nesting
- **Heuristic threshold:** 60 (score 60+ = malicious, 30-59 = suspicious)
- **Block mode:** Disabled (monitor reports but does not block file access)
- **Auto-quarantine:** Disabled (threats are reported but not moved)
- **Vault size limit:** 1024 MiB

## Editing the Config File Directly

You can also edit `~/.prx-sd/config.json` with any text editor. PRX-SD reads the file at the start of each command, so changes take effect immediately.

```bash
# Open in your editor
$EDITOR ~/.prx-sd/config.json
```

Make sure the file is valid JSON. If it is malformed, PRX-SD falls back to default values and prints a warning.

## Data Directory Structure

```
~/.prx-sd/
  config.json       # Engine configuration
  signatures/       # LMDB hash signature database
  yara/             # Compiled YARA rule files
  quarantine/       # AES-256-GCM encrypted quarantine vault
  adblock/          # Adblock filter lists and logs
  plugins/          # WASM plugin directories
  audit/            # Scan audit logs (JSONL)
  prx-sd.pid        # Daemon PID file (when running)
```

## Next Steps

- See the [Configuration Reference](./reference) for every key, type, and default value
- Learn about [Scanning](../scanning/file-scan) to understand how config affects scans
- Set up [Real-Time Monitoring](../realtime/) and configure `monitor.block_mode`
- Configure [Quarantine](../quarantine/) auto-quarantine behavior
