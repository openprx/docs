---
title: Quick Start
description: Get PRX-SD scanning for malware in 5 minutes. Install, update signatures, scan files, review results, and enable real-time monitoring.
---

# Quick Start

This guide takes you from zero to your first malware scan in under 5 minutes. By the end, you will have PRX-SD installed, signatures updated, and real-time monitoring running.

::: tip Prerequisites
You need a Linux or macOS system with `curl` installed. See the [Installation Guide](./installation) for other methods and platform details.
:::

## Step 1: Install PRX-SD

Download and install the latest release with the install script:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Verify the installation:

```bash
sd --version
```

You should see output like:

```
prx-sd 0.5.0
```

## Step 2: Update the Signature Database

PRX-SD ships with a built-in blocklist, but you need to download the latest threat intelligence for full protection. The `update` command fetches hash signatures and YARA rules from all configured sources:

```bash
sd update
```

Expected output:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip Full Update
To include the complete VirusShare database (20M+ MD5 hashes), run:
```bash
sd update --full
```
This takes longer but provides maximum hash coverage.
:::

## Step 3: Scan a File or Directory

Scan a single suspicious file:

```bash
sd scan /path/to/suspicious_file
```

Scan an entire directory recursively:

```bash
sd scan /home --recursive
```

Example output for a clean directory:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

Example output when threats are found:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## Step 4: Review Results and Take Action

For a detailed JSON report suitable for automation or log ingestion:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

To automatically quarantine detected threats during a scan:

```bash
sd scan /home --recursive --auto-quarantine
```

Quarantined files are moved to a secure, encrypted directory. You can list and restore them:

```bash
# List quarantined files
sd quarantine list

# Restore a file by its quarantine ID
sd quarantine restore QR-20260321-001
```

::: warning Quarantine
Quarantined files are encrypted and cannot be accidentally executed. Use `sd quarantine restore` only if you are certain the file is a false positive.
:::

## Step 5: Enable Real-Time Monitoring

Start the real-time monitor to watch directories for new or modified files:

```bash
sd monitor /home /tmp /var/www
```

The monitor runs in the foreground and scans files as they are created or changed:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

To run the monitor as a background service:

```bash
# Install and start the systemd service
sd service install
sd service start

# Check service status
sd service status
```

## What You Have Now

After completing these steps, your system has:

| Component | Status |
|-----------|--------|
| `sd` binary | Installed in PATH |
| Hash database | 28,000+ SHA-256/MD5 hashes in LMDB |
| YARA rules | 38,800+ rules from 8 sources |
| Real-time monitor | Watching specified directories |

## Next Steps

- [File & Directory Scanning](../scanning/file-scan) -- Explore all `sd scan` options including threads, exclusions, and size limits
- [Memory Scanning](../scanning/memory-scan) -- Scan running process memory for in-memory threats
- [Rootkit Detection](../scanning/rootkit) -- Check for kernel and userspace rootkits
- [Detection Engine](../detection/) -- Understand how the multi-layer pipeline works
- [YARA Rules](../detection/yara-rules) -- Learn about rule sources and custom rules
