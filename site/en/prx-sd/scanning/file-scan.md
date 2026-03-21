---
title: File & Directory Scanning
description: Complete reference for the sd scan command. Scan files and directories for malware with hash matching, YARA rules, and heuristic analysis.
---

# File & Directory Scanning

The `sd scan` command is the primary way to check files and directories for malware. It runs every file through the multi-layer detection pipeline -- hash matching, YARA rules, and heuristic analysis -- and reports a verdict for each file.

## Basic Usage

Scan a single file:

```bash
sd scan /path/to/file
```

Scan a directory (non-recursive by default):

```bash
sd scan /home/user/downloads
```

Scan a directory and all subdirectories:

```bash
sd scan /home --recursive
```

## Command Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--recursive` | `-r` | off | Recurse into subdirectories |
| `--json` | `-j` | off | Output results in JSON format |
| `--threads` | `-t` | CPU cores | Number of parallel scan threads |
| `--auto-quarantine` | `-q` | off | Automatically quarantine detected threats |
| `--remediate` | | off | Attempt automatic remediation (delete/quarantine based on policy) |
| `--exclude` | `-e` | none | Glob pattern to exclude files or directories |
| `--report` | | none | Write scan report to a file path |
| `--max-size-mb` | | 100 | Skip files larger than this size in megabytes |
| `--no-yara` | | off | Skip YARA rule scanning |
| `--no-heuristics` | | off | Skip heuristic analysis |
| `--min-severity` | | `suspicious` | Minimum severity to report (`suspicious` or `malicious`) |

## Detection Flow

When `sd scan` processes a file, it passes through the detection pipeline in order:

```
File → Magic Number Detection → Determine File Type
  │
  ├─ Layer 1: SHA-256 Hash Lookup (LMDB)
  │   Hit → MALICIOUS (instant, ~1μs per file)
  │
  ├─ Layer 2: YARA-X Rule Scan (38,800+ rules)
  │   Hit → MALICIOUS with rule name
  │
  ├─ Layer 3: Heuristic Analysis (file-type-aware)
  │   Score ≥ 60 → MALICIOUS
  │   Score 30-59 → SUSPICIOUS
  │   Score < 30 → CLEAN
  │
  └─ Result Aggregation → highest severity wins
```

The pipeline short-circuits: if a hash match is found, YARA and heuristic analysis are skipped for that file. This makes scanning large directories fast -- most clean files are resolved at the hash layer in microseconds.

## Output Formats

### Human-Readable (default)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### JSON Output

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### Report File

Write results to a file for archival:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## Exclusion Patterns

Use `--exclude` to skip files or directories matching glob patterns. Multiple patterns can be specified:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip Performance
Excluding large directories like `node_modules`, `.git`, and virtual machine images significantly improves scan speed.
:::

## Auto-Quarantine

The `--auto-quarantine` flag moves detected threats to the quarantine vault during the scan:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

Quarantined files are encrypted with AES-256 and stored in `~/.local/share/prx-sd/quarantine/`. They cannot be accidentally executed. See the [Quarantine documentation](../quarantine/) for details.

## Example Scenarios

### CI/CD Pipeline Scan

Scan build artifacts before deployment:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

Use the exit code for automation: `0` = clean, `1` = threats found, `2` = scan error.

### Web Server Daily Scan

Schedule a nightly scan of web-accessible directories:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### Forensic Investigation

Scan a disk image mounted as read-only:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning Large Scans
When scanning millions of files, use `--threads` to control resource usage and `--max-size-mb` to skip oversized files that may slow the scan.
:::

### Home Directory Quick Check

Fast scan of common threat locations:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## Performance Tuning

| Files | Approximate Time | Notes |
|-------|-------------------|-------|
| 1,000 | < 1 second | Hash layer resolves most files |
| 10,000 | 2-5 seconds | YARA rules add ~0.3ms per file |
| 100,000 | 20-60 seconds | Depends on file sizes and types |
| 1,000,000+ | 5-15 minutes | Use `--threads` and `--exclude` |

Factors affecting scan speed:

- **Disk I/O** -- SSD is 5-10x faster than HDD for random reads
- **File size distribution** -- Many small files are faster than few large files
- **Detection layers** -- Hash-only scans (`--no-yara --no-heuristics`) are fastest
- **Thread count** -- More threads help on multi-core systems with fast storage

## Next Steps

- [Memory Scanning](./memory-scan) -- Scan running process memory
- [Rootkit Detection](./rootkit) -- Check for kernel-level threats
- [USB Scanning](./usb-scan) -- Scan removable media
- [Detection Engine](../detection/) -- How each detection layer works
