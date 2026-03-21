---
title: Process Memory Scanning
description: Scan running process memory for in-memory malware, fileless threats, and injected code using sd scan-memory.
---

# Process Memory Scanning

The `sd scan-memory` command scans the memory of running processes to detect fileless malware, injected shellcode, and in-memory threats that never touch disk. This is essential for catching advanced threats that evade traditional file-based scanning.

::: warning Requirements
- **Root privileges required** -- Memory scanning reads `/proc/<pid>/mem`, which requires root or `CAP_SYS_PTRACE`.
- **Linux only** -- Process memory scanning is currently supported on Linux. macOS support is planned.
:::

## How It Works

Process memory scanning reads the virtual memory mappings of a running process and applies the same detection pipeline used for file scanning:

1. **Enumerate memory regions** -- Parse `/proc/<pid>/maps` to find readable memory segments (heap, stack, anonymous mappings, mapped files).
2. **Read memory contents** -- Read each region from `/proc/<pid>/mem`.
3. **YARA rule scan** -- Apply in-memory YARA rules optimized for detecting shellcode patterns, injected DLLs, and known malware signatures in memory.
4. **Pattern analysis** -- Check for suspicious patterns such as RWX memory regions, PE headers in non-file-backed mappings, and known exploit payloads.

## Basic Usage

Scan all running processes:

```bash
sudo sd scan-memory
```

Scan a specific process by PID:

```bash
sudo sd scan-memory --pid 1234
```

Scan multiple specific processes:

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## Command Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--pid` | `-p` | all | Scan only the specified process ID (repeatable) |
| `--json` | `-j` | off | Output results in JSON format |
| `--exclude-pid` | | none | Exclude specific PIDs from scanning |
| `--exclude-user` | | none | Exclude processes owned by a specific user |
| `--min-region-size` | | 4096 | Minimum memory region size to scan (bytes) |
| `--skip-mapped-files` | | off | Skip file-backed memory regions |

## Output Example

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### JSON Output

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## Use Cases

### Incident Response

During an active investigation, scan all processes to find compromised services:

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### Fileless Malware Detection

Modern malware often executes entirely in memory without writing to disk. Common techniques include:

- **Process injection** -- Malware injects code into legitimate processes using `ptrace` or `/proc/pid/mem` writes
- **Reflective DLL loading** -- A DLL is loaded from memory without touching the filesystem
- **Shellcode execution** -- Raw shellcode is allocated in RWX memory and executed directly

`sd scan-memory` detects these patterns by looking for:

| Indicator | Description |
|-----------|-------------|
| RWX anonymous mappings | Executable code in non-file-backed memory |
| PE headers in memory | Windows PE structures in Linux process memory (cross-platform payloads) |
| Known shellcode signatures | Metasploit, CobaltStrike, Sliver beacon patterns |
| Suspicious syscall stubs | Hooked or patched syscall entry points |

### Server Health Check

Run periodic memory scans on production servers:

```bash
# Add to cron: scan every 6 hours
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip Performance Impact
Memory scanning reads process memory and may briefly increase I/O. On production servers, consider scanning during low-traffic periods or excluding non-critical processes.
:::

## Limitations

- Memory scanning reads a snapshot of process memory at the time of the scan. Rapidly changing memory regions may yield incomplete results.
- Kernel memory is not scanned by `scan-memory`. Use `sd check-rootkit` for kernel-level threat detection.
- Heavily obfuscated or encrypted in-memory payloads may evade YARA rules. The pattern analysis layer provides a secondary detection mechanism.

## Next Steps

- [Rootkit Detection](./rootkit) -- Detect kernel and userspace rootkits
- [File & Directory Scanning](./file-scan) -- Traditional file-based scanning
- [YARA Rules](../detection/yara-rules) -- Understand the rule engine used for memory scanning
- [Detection Engine](../detection/) -- How all detection layers work together
