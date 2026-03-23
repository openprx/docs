---
title: Configuration Reference
description: Complete reference for every PRX-SD configuration key, including types, default values, and detailed descriptions.
---

# Configuration Reference

This page documents every configuration key in `~/.prx-sd/config.json`. Use `sd config set <key> <value>` to modify any setting, or edit the JSON file directly.

## Scan Settings (`scan.*`)

Settings that control how the scan engine processes files.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `scan.max_file_size` | `integer` | `104857600` (100 MiB) | Maximum file size in bytes. Files larger than this value are skipped during scanning. Set to `0` to disable the limit (not recommended). |
| `scan.threads` | `integer \| null` | `null` (auto) | Number of parallel scanner threads. When `null`, PRX-SD uses the number of logical CPU cores. Set to a specific number to limit or increase parallelism. |
| `scan.timeout_per_file_ms` | `integer` | `30000` (30 s) | Maximum time in milliseconds allowed for scanning a single file. If exceeded, the file is marked as an error and scanning continues to the next file. |
| `scan.scan_archives` | `boolean` | `true` | Whether to recurse into archive files (ZIP, tar.gz, 7z, RAR, etc.) and scan their contents. |
| `scan.max_archive_depth` | `integer` | `3` | Maximum nesting depth when recursing into archives. For example, a ZIP inside a ZIP inside a ZIP would require depth 3. Prevents zip-bomb attacks. |
| `scan.heuristic_threshold` | `integer` | `60` | Minimum heuristic score (0-100) to flag a file as **Malicious**. Files scoring between 30 and this threshold are flagged as **Suspicious**. Lower values increase sensitivity but may produce more false positives. |
| `scan.exclude_paths` | `string[]` | `[]` | List of glob patterns or path prefixes to exclude from scanning. Supports `*` (any characters) and `?` (single character) wildcards. |

### Examples

```bash
# Increase max file size to 500 MiB
sd config set scan.max_file_size 524288000

# Use exactly 4 threads
sd config set scan.threads 4

# Increase per-file timeout to 60 seconds
sd config set scan.timeout_per_file_ms 60000

# Disable archive scanning
sd config set scan.scan_archives false

# Set archive nesting depth to 5
sd config set scan.max_archive_depth 5

# Lower heuristic threshold for higher sensitivity
sd config set scan.heuristic_threshold 40

# Exclude paths
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## Monitor Settings (`monitor.*`)

Settings that control real-time file system monitoring (`sd monitor` and `sd daemon`).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `monitor.block_mode` | `boolean` | `false` | When `true`, use fanotify permission events (Linux only) to **block** access to malicious files before the requesting process can read them. Requires root privileges. When `false`, files are scanned after creation/modification and threats are reported but not blocked. |
| `monitor.channel_capacity` | `integer` | `4096` | Size of the internal event channel buffer between the filesystem watcher and the scanner. Increase this if you see "channel full" warnings under high file-system activity. |

### Examples

```bash
# Enable block mode (requires root)
sd config set monitor.block_mode true

# Increase channel buffer for busy servers
sd config set monitor.channel_capacity 16384
```

::: warning
Block mode (`monitor.block_mode = true`) uses Linux fanotify permission events. This requires:
- Root privileges
- A Linux kernel with `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` enabled
- The PRX-SD daemon running as root

On macOS and Windows, block mode is not available and this setting is ignored.
:::

## Update Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `update_server_url` | `string \| null` | `null` | URL of a custom signature update server. When `null`, PRX-SD fetches updates from the `openprx/prx-sd-signatures` GitHub repository using the GitHub API. When set to a URL, the legacy manifest-based update server protocol is used instead. |

### Examples

```bash
# Use a private update server (legacy protocol)
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# Reset to GitHub default
sd config set update_server_url null
```

## Quarantine Settings (`quarantine.*`)

Settings that control the encrypted quarantine vault.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | When `true`, automatically move files detected as **Malicious** to the quarantine vault during scanning. When `false`, threats are reported but files remain in place. |
| `quarantine.max_vault_size_mb` | `integer` | `1024` (1 GiB) | Maximum total size of the quarantine vault in MiB. When this limit is reached, new files cannot be quarantined until older entries are deleted. |

### Examples

```bash
# Enable automatic quarantine
sd config set quarantine.auto_quarantine true

# Increase vault size to 5 GiB
sd config set quarantine.max_vault_size_mb 5120

# Disable auto-quarantine (report only)
sd config set quarantine.auto_quarantine false
```

## Complete Default Configuration

For reference, here is the full default configuration:

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
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

## Value Parsing Rules

When using `sd config set`, values are automatically parsed in this order:

1. **Boolean** -- `true` or `false`
2. **Null** -- `null`
3. **Integer** -- e.g. `42`, `104857600`
4. **Float** -- e.g. `3.14`
5. **JSON array/object** -- e.g. `'["/proc", "*.log"]'`, `'{"key": "value"}'`
6. **String** -- anything else, e.g. `"https://example.com"`

::: tip
When setting arrays or objects, wrap the value in single quotes to prevent shell expansion:
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## Related Commands

| Command | Description |
|---------|-------------|
| `sd config show` | Display current configuration |
| `sd config set <key> <value>` | Set a configuration value |
| `sd config reset` | Reset all settings to defaults |
| `sd policy show` | Display remediation policy |
| `sd policy set <key> <value>` | Set a remediation policy value |
| `sd policy reset` | Reset remediation policy to defaults |

## Next Steps

- Return to the [Configuration Overview](./index) for a general introduction
- Learn how `scan.*` settings affect [File Scanning](../scanning/file-scan)
- Configure [Real-Time Monitoring](../realtime/) with `monitor.*` settings
- Set up [Quarantine](../quarantine/) with auto-quarantine
