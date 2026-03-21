---
title: Quarantine Management
description: Manage quarantined threats with AES-256-GCM encrypted vault, restore files, and review quarantine statistics.
---

# Quarantine Management

When PRX-SD detects a threat, it can isolate the file in an encrypted quarantine vault. Quarantined files are encrypted with AES-256-GCM, renamed, and moved to a secure directory where they cannot be accidentally executed. All original metadata is preserved for forensic analysis.

## How Quarantine Works

```
Threat detected
  1. Generate random AES-256-GCM key
  2. Encrypt file contents
  3. Store encrypted blob in vault.bin
  4. Save metadata (original path, hash, detection info) as JSON
  5. Delete original file from disk
  6. Log quarantine event
```

The quarantine vault is stored at `~/.prx-sd/quarantine/`:

```
~/.prx-sd/quarantine/
  vault.bin                    # Encrypted file store (append-only)
  index.json                   # Quarantine index with metadata
  entries/
    a1b2c3d4.json             # Per-entry metadata
    e5f6g7h8.json
```

Each quarantine entry contains:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
The quarantine vault uses authenticated encryption (AES-256-GCM). This prevents both accidental execution of quarantined malware and tampering with evidence.
:::

## Listing Quarantined Files

```bash
sd quarantine list [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--json` | | `false` | Output as JSON |
| `--sort` | `-s` | `date` | Sort by: `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | Filter by severity: `malicious`, `suspicious` |
| `--limit` | `-n` | all | Maximum entries to display |

### Example

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## Restoring Files

Restore a quarantined file to its original location or a specified path:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--to` | `-t` | original path | Restore to a different location |
| `--force` | `-f` | `false` | Overwrite if destination exists |

::: warning
Restoring a quarantined file places a known-malicious or suspicious file back on disk. Only restore files if you have confirmed them as false positives or need them for analysis in an isolated environment.
:::

### Examples

```bash
# Restore to original location
sd quarantine restore a1b2c3d4

# Restore to a specific directory for analysis
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# Force overwrite if file exists at destination
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## Deleting Quarantined Files

Permanently delete quarantined entries:

```bash
# Delete a single entry
sd quarantine delete <ID>

# Delete all entries
sd quarantine delete-all

# Delete entries older than 30 days
sd quarantine delete --older-than 30d

# Delete all entries with a specific severity
sd quarantine delete --filter malicious
```

When deleting, the encrypted data is overwritten with zeros before being removed from the vault.

::: warning
Deletion is permanent. The encrypted file data and metadata are irrecoverable after deletion. Consider exporting entries for archival before deleting.
:::

## Quarantine Statistics

View aggregate statistics about the quarantine vault:

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## Automatic Quarantine

Enable automatic quarantine during scans or monitoring:

```bash
# Scan with auto-quarantine
sd scan /tmp --auto-quarantine

# Monitor with auto-quarantine
sd monitor --auto-quarantine /home /tmp

# Daemon with auto-quarantine
sd daemon start --auto-quarantine
```

Or set it as the default policy:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## Exporting Quarantine Data

Export quarantine metadata for reporting or SIEM integration:

```bash
# Export all metadata as JSON
sd quarantine list --json > quarantine_report.json

# Export statistics as JSON
sd quarantine stats --json > quarantine_stats.json
```

## Next Steps

- [Threat Response](/en/prx-sd/remediation/) -- configure response policies beyond quarantine
- [File Monitoring](/en/prx-sd/realtime/monitor) -- real-time protection with auto-quarantine
- [Webhook Alerts](/en/prx-sd/alerts/webhook) -- get notified when files are quarantined
- [Threat Intelligence](/en/prx-sd/signatures/) -- signature database overview
