---
title: Rootkit Detection
description: Detect kernel and userspace rootkits on Linux using sd check-rootkit. Checks hidden processes, kernel modules, system call hooks, and more.
---

# Rootkit Detection

The `sd check-rootkit` command performs deep system integrity checks to detect both kernel-level and userspace rootkits. Rootkits are among the most dangerous types of malware because they hide their presence from standard system tools, making them invisible to conventional file scanners.

::: warning Requirements
- **Root privileges required** -- Rootkit detection reads kernel data structures and system internals.
- **Linux only** -- This feature relies on `/proc`, `/sys`, and Linux-specific kernel interfaces.
:::

## What It Detects

PRX-SD checks for rootkit presence across multiple vectors:

### Kernel-Level Checks

| Check | Description |
|-------|-------------|
| Hidden kernel modules | Compare loaded modules from `/proc/modules` against `sysfs` entries to find discrepancies |
| System call table hooks | Verify syscall table entries against known-good kernel symbols |
| `/proc` inconsistencies | Detect processes hidden from `/proc` but visible through other interfaces |
| Kernel symbol tampering | Check for modified function pointers in key kernel structures |
| Interrupt descriptor table | Verify IDT entries for unexpected modifications |

### Userspace Checks

| Check | Description |
|-------|-------------|
| Hidden processes | Cross-reference `readdir(/proc)` results with brute-force PID enumeration |
| LD_PRELOAD injection | Check for malicious shared libraries loaded via `LD_PRELOAD` or `/etc/ld.so.preload` |
| Binary replacement | Verify integrity of critical system binaries (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| Hidden files | Detect files hidden by intercepting `getdents` syscall |
| Suspicious cron entries | Scan crontabs for obfuscated or encoded commands |
| Systemd service tampering | Check for unauthorized or modified systemd units |
| SSH backdoors | Look for unauthorized SSH keys, modified `sshd_config`, or backdoored `sshd` binaries |
| Network listeners | Identify hidden network sockets not shown by `ss`/`netstat` |

## Basic Usage

Run a full rootkit check:

```bash
sudo sd check-rootkit
```

Example output:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## Command Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--json` | `-j` | off | Output results in JSON format |
| `--kernel-only` | | off | Only run kernel-level checks |
| `--userspace-only` | | off | Only run userspace checks |
| `--baseline` | | none | Path to a baseline file for comparison |
| `--save-baseline` | | none | Save current state as a baseline |

## Baseline Comparison

For ongoing monitoring, create a baseline of your known-good system state and compare against it in future checks:

```bash
# Create baseline on a known-clean system
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# Future checks compare against baseline
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

The baseline records kernel module lists, syscall table hashes, critical binary checksums, and network listener states. Any deviation triggers an alert.

## JSON Output

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## Example: Detecting a Kernel Module Rootkit

When a rootkit hides a kernel module, `sd check-rootkit` detects the inconsistency:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning Critical Findings
A `CRITICAL` finding from the rootkit checker should be treated as a serious security incident. Do not attempt remediation on a potentially compromised system. Instead, isolate the machine and investigate from trusted media.
:::

## Scheduling Regular Checks

Add rootkit checks to your monitoring routine:

```bash
# Cron: check every 4 hours
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## Next Steps

- [Memory Scanning](./memory-scan) -- Detect in-memory threats in running processes
- [File & Directory Scanning](./file-scan) -- Traditional file-based scanning
- [USB Scanning](./usb-scan) -- Scan removable media on connection
- [Detection Engine](../detection/) -- Overview of all detection layers
