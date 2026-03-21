---
title: Ransomware Protection
description: Behavioral ransomware detection using entropy analysis, extension monitoring, and batch encryption detection.
---

# Ransomware Protection

PRX-SD includes a dedicated `RansomwareDetector` engine that identifies ransomware behavior in real time. Unlike signature-based detection which requires known samples, the ransomware detector uses behavioral heuristics to catch zero-day ransomware before it finishes encrypting your files.

## How It Works

The ransomware detector runs as part of the real-time monitor and analyzes file system events for patterns that indicate active encryption. It operates on three detection axes:

### 1. Batch Encryption Detection

The detector tracks file modification rates per-process and per-directory. When a single process modifies an abnormally high number of files in a short time window, it triggers an alert.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `batch_threshold` | `20` | Number of file modifications to trigger detection |
| `batch_window_secs` | `10` | Time window in seconds for batch counting |
| `min_files_affected` | `5` | Minimum distinct files before alerting |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. Extension Change Monitoring

Ransomware typically renames files with a new extension after encryption. The detector watches for mass extension changes, particularly to known ransomware extensions:

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
Extension monitoring alone is not sufficient -- sophisticated ransomware may use random or legitimate-looking extensions. PRX-SD combines extension changes with entropy analysis for reliable detection.
:::

### 3. High Entropy Detection

Encrypted files have near-maximum Shannon entropy (close to 8.0 for byte-level analysis). The detector compares file entropy before and after modification:

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| File entropy | > 7.8 | File content is likely encrypted or compressed |
| Entropy delta | > 3.0 | File changed from low to high entropy (encryption) |
| Header entropy | > 7.5 | First 4KB is high entropy (original magic bytes destroyed) |

When a file's entropy jumps significantly after modification, and the file was previously a known document type (PDF, DOCX, image), this is a strong indicator of encryption.

## Detection Scoring

Each detection axis contributes to a composite ransomware score:

| Signal | Weight | Description |
|--------|--------|-------------|
| Batch file modification | 40 | Many files modified rapidly by one process |
| Extension change to known ransomware ext | 30 | File renamed with ransomware extension |
| Extension change to unknown ext | 15 | File renamed with unusual new extension |
| High entropy delta | 25 | File entropy increased dramatically |
| High absolute entropy | 10 | File has near-maximum entropy |
| Ransom note creation | 35 | Files matching ransom note patterns detected |
| Shadow copy deletion | 50 | Attempt to delete volume shadow copies |

A composite score above **60** triggers a `MALICIOUS` verdict. Scores between **30-59** produce a `SUSPICIOUS` alert.

## Ransom Note Detection

The detector watches for the creation of files matching common ransom note patterns:

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
Ransom note detection is pattern-based and does not require the note file itself to be malicious. The mere creation of a file matching these patterns, combined with other signals, contributes to the ransomware score.
:::

## Automatic Response

When ransomware is detected, the response depends on the configured policy:

| Action | Description |
|--------|-------------|
| **Alert** | Log the event and send notifications (webhook, email) |
| **Block** | Deny the file operation (Linux fanotify blocking mode only) |
| **Kill** | Terminate the offending process |
| **Quarantine** | Move affected files to encrypted quarantine vault |
| **Isolate** | Block all network access for the machine (emergency) |

Configure the response in `config.toml`:

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # quarantine modified files as evidence
notify_webhook = true           # send webhook notification
notify_email = true             # send email alert
snapshot_process_tree = true    # capture process tree for forensics
```

## Configuration

Full ransomware detector configuration:

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# Directories to protect with higher sensitivity
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# Processes exempt from monitoring (e.g., backup software)
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## Examples

```bash
# Start monitoring with ransomware protection
sd monitor --auto-quarantine /home

# The ransomware detector is enabled by default in daemon mode
sd daemon start

# Check ransomware detector status
sd status --verbose
```

## Next Steps

- [File Monitoring](./monitor) -- configure real-time monitoring
- [Daemon](./daemon) -- run as a background service
- [Threat Response](/en/prx-sd/remediation/) -- full remediation policy configuration
- [Webhook Alerts](/en/prx-sd/alerts/webhook) -- get instant notifications
