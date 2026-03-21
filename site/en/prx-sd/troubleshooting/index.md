---
title: Troubleshooting
description: Solutions for common PRX-SD issues including signature updates, scan performance, permissions, false positives, daemon problems, and memory usage.
---

# Troubleshooting

This page covers the most common issues encountered when running PRX-SD, along with their causes and solutions.

## Signature Database Update Fails

**Symptoms:** `sd update` fails with a network error, timeout, or SHA-256 mismatch.

**Possible Causes:**
- No internet connection or firewall blocking outbound HTTPS
- The update server is temporarily unavailable
- A proxy or corporate firewall is modifying the response

**Solutions:**

1. **Check connectivity** to the update server:

```bash
curl -fsSL https://update.prx-sd.dev/v1/manifest.json
```

2. **Use the offline update script** if you have network restrictions:

```bash
# On a machine with internet access
./tools/update-signatures.sh

# Copy the signatures directory to the target machine
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **Force re-download** to clear any corrupted cache:

```bash
sd update --force
```

4. **Use a custom update server** if you host a private mirror:

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **Check the SHA-256 mismatch** -- this usually means the download was corrupted in transit. Try again, or download manually:

```bash
sd update --force
```

::: tip
Run `sd update --check-only` to verify whether an update is available without downloading.
:::

## Scan Speed Is Slow

**Symptoms:** Scanning a directory takes much longer than expected.

**Possible Causes:**
- Scanning network-mounted filesystems (NFS, CIFS, SSHFS)
- YARA rules are being compiled on every scan (no cached compilation)
- Too many threads competing for I/O on spinning disks
- Archive recursion on large nested archives

**Solutions:**

1. **Increase thread count** for SSD-backed storage:

```bash
sd config set scan.threads 16
```

2. **Reduce thread count** for spinning disks (I/O-bound):

```bash
sd config set scan.threads 2
```

3. **Exclude slow or irrelevant paths**:

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. **Disable archive scanning** if not needed:

```bash
sd config set scan.scan_archives false
```

5. **Reduce archive depth** to avoid deeply nested archives:

```bash
sd config set scan.max_archive_depth 1
```

6. **Use the `--exclude` flag** for one-off scans:

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **Enable debug logging** to find bottlenecks:

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify Permission Errors

**Symptoms:** `sd monitor --block` fails with "Permission denied" or "Operation not permitted".

**Possible Causes:**
- Not running as root
- Linux kernel does not have `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` enabled
- AppArmor or SELinux is blocking fanotify access

**Solutions:**

1. **Run as root**:

```bash
sudo sd monitor /home /tmp --block
```

2. **Check kernel config**:

```bash
zgrep FANOTIFY /proc/config.gz
# Should show: CONFIG_FANOTIFY=y and CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **Use non-block mode** as a fallback (still detects threats, but does not prevent file access):

```bash
sd monitor /home /tmp
```

::: warning
Block mode is only available on Linux with fanotify support. On macOS (FSEvents) and Windows (ReadDirectoryChangesW), real-time monitoring operates in detect-only mode.
:::

4. **Check SELinux/AppArmor**:

```bash
# SELinux: check for denials
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: check for denials
dmesg | grep apparmor | grep prx-sd
```

## False Positive (Legitimate File Detected as Threat)

**Symptoms:** A known-safe file is flagged as Suspicious or Malicious.

**Solutions:**

1. **Check what triggered the detection**:

```bash
sd scan /path/to/file --json
```

Look at the `detection_type` and `threat_name` fields:
- `HashMatch` -- the file's hash matches a known malware hash (unlikely false positive)
- `YaraRule` -- a YARA rule matched patterns in the file
- `Heuristic` -- the heuristic engine scored the file above the threshold

2. **For heuristic false positives**, raise the threshold:

```bash
# Default is 60; raise to 70 for fewer false positives
sd config set scan.heuristic_threshold 70
```

3. **Exclude the file or directory from scanning**:

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **For YARA false positives**, you can exclude specific rules by removing or commenting them out in the `~/.prx-sd/yara/` directory.

5. **Whitelist via hash** -- add the file's SHA-256 to a local allowlist (future feature). As a workaround, exclude the file by path.

::: tip
If you believe a detection is a genuine false positive, please report it at [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues) with the file hash (not the file itself) and the rule name.
:::

## Daemon Cannot Start

**Symptoms:** `sd daemon` exits immediately, or `sd status` shows "stopped".

**Possible Causes:**
- Another instance is already running (PID file exists)
- The data directory is inaccessible or corrupt
- The signature database is missing

**Solutions:**

1. **Check for a stale PID file**:

```bash
cat ~/.prx-sd/prx-sd.pid
# If the listed PID is not running, remove the file
rm ~/.prx-sd/prx-sd.pid
```

2. **Check daemon status**:

```bash
sd status
```

3. **Run in foreground** with debug logging to see startup errors:

```bash
sd --log-level debug daemon /home /tmp
```

4. **Ensure signatures exist**:

```bash
sd info
# If hash_count is 0, run:
sd update
```

5. **Check directory permissions**:

```bash
ls -la ~/.prx-sd/
# All directories should be owned by your user and writable
```

6. **Reinitialize** if the data directory is corrupt:

```bash
# Back up existing data
mv ~/.prx-sd ~/.prx-sd.bak

# Re-run any command to trigger first-run setup
sd info

# Re-download signatures
sd update
```

## Log Level Adjustment

**Problem:** You need more diagnostic information to debug an issue.

PRX-SD supports five log levels, from most to least verbose:

| Level | Description |
|-------|-------------|
| `trace` | Everything, including per-file YARA matching details |
| `debug` | Detailed engine operations, plugin loading, hash lookups |
| `info` | Scan progress, signature updates, plugin registration |
| `warn` | Warnings and non-fatal errors (default) |
| `error` | Only critical errors |

```bash
# Maximum verbosity
sd --log-level trace scan /tmp

# Debug-level for troubleshooting
sd --log-level debug monitor /home

# Redirect logs to a file for analysis
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
The `--log-level` flag is global and must come **before** the subcommand:
```bash
# Correct
sd --log-level debug scan /tmp

# Incorrect (flag after subcommand)
sd scan /tmp --log-level debug
```
:::

## High Memory Usage

**Symptoms:** The `sd` process consumes more memory than expected, especially during large directory scans.

**Possible Causes:**
- Scanning a very large number of files with many threads
- YARA rules are compiled into memory (38,800+ rules use significant memory)
- Archive scanning inflates large compressed files into memory
- WASM plugins with high `max_memory_mb` limits

**Solutions:**

1. **Reduce thread count** (each thread loads its own YARA context):

```bash
sd config set scan.threads 2
```

2. **Limit maximum file size** to skip very large files:

```bash
# Limit to 50 MiB
sd config set scan.max_file_size 52428800
```

3. **Disable archive scanning** for memory-constrained systems:

```bash
sd config set scan.scan_archives false
```

4. **Reduce archive depth**:

```bash
sd config set scan.max_archive_depth 1
```

5. **Check WASM plugin memory limits** -- review `~/.prx-sd/plugins/*/plugin.json` for plugins with high `max_memory_mb` values and reduce them.

6. **Monitor memory during scans**:

```bash
# In another terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **For the daemon**, monitor memory over time:

```bash
sd status
# Shows PID; use top/htop to watch memory
```

## Other Common Issues

### "No YARA rules found" Warning

The YARA rules directory is empty. Re-run first-time setup or download rules:

```bash
sd update
# Or manually trigger setup by removing the yara directory:
rm -rf ~/.prx-sd/yara
sd info  # triggers first-run setup with embedded rules
```

### "Failed to open signature database" Error

The LMDB signature database may be corrupt:

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock: "insufficient privileges"

The adblock enable/disable commands modify the system hosts file and require root:

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### Scan Skips Files with "timeout" Error

Individual file timeouts default to 30 seconds. Increase for complex files:

```bash
sd config set scan.timeout_per_file_ms 60000
```

## Getting Help

If none of the above solutions resolve your issue:

1. **Check existing issues:** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **File a new issue** with:
   - PRX-SD version (`sd info`)
   - Operating system and kernel version
   - Debug log output (`sd --log-level debug ...`)
   - Steps to reproduce

## Next Steps

- Review the [Configuration Reference](../configuration/reference) to fine-tune engine behavior
- Learn about the [Detection Engine](../detection/) to understand how threats are identified
- Set up [Alerts](../alerts/) to get notified of issues proactively
