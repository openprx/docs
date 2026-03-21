---
title: Import Hashes
description: Import custom hash blocklists and ClamAV signature databases into PRX-SD.
---

# Import Hashes

PRX-SD allows you to import custom hash blocklists and ClamAV signature databases to extend detection coverage with your own threat intelligence or organizational blocklists.

## Importing Custom Hashes

### Usage

```bash
sd import [OPTIONS] <FILE>
```

### Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--format` | `-f` | auto-detect | Hash format: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | filename | Label for the imported set |
| `--replace` | | `false` | Replace existing entries with the same label |
| `--dry-run` | | `false` | Validate file without importing |
| `--quiet` | `-q` | `false` | Suppress progress output |

### Supported Hash File Formats

PRX-SD accepts several common formats:

**Plain list** -- one hash per line:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**Hash with label** -- hash followed by a space and optional description:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV format** -- comma-separated with headers:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**Comment lines** -- lines starting with `#` are ignored:

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
Hash format is auto-detected based on length: 32 characters = MD5, 40 characters = SHA-1, 64 characters = SHA-256. Use `--format` to override if detection fails.
:::

### Import Examples

```bash
# Import a SHA-256 blocklist
sd import threat_hashes.txt

# Import with explicit format and label
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Dry run to validate file
sd import --dry-run suspicious_hashes.csv

# Replace an existing import set
sd import --replace --label "daily-feed" today_hashes.txt
```

### Import Output

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## Importing ClamAV Databases

### Usage

```bash
sd import-clamav [OPTIONS] <FILE>
```

### Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--type` | `-t` | auto-detect | Database type: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | Suppress progress output |

### Supported ClamAV Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| **CVD** | `.cvd` | ClamAV Virus Database (compressed, signed) |
| **CLD** | `.cld` | ClamAV Local Database (incremental updates) |
| **HDB** | `.hdb` | MD5 hash database (plain text) |
| **HSB** | `.hsb` | SHA-256 hash database (plain text) |
| **NDB** | `.ndb` | Extended signature format (body-based) |

::: warning
CVD/CLD files can be very large. The `main.cvd` file alone contains over 6 million signatures and requires approximately 300 MB of disk space after import.
:::

### ClamAV Import Examples

```bash
# Import the main ClamAV database
sd import-clamav /var/lib/clamav/main.cvd

# Import the daily update database
sd import-clamav /var/lib/clamav/daily.cvd

# Import a plain-text hash database
sd import-clamav custom_sigs.hdb

# Import an SHA-256 hash database
sd import-clamav my_hashes.hsb
```

### Setting Up ClamAV Integration

To use ClamAV signatures with PRX-SD:

1. Install freshclam (ClamAV updater):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. Download the databases:

```bash
sudo freshclam
```

3. Import into PRX-SD:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. Enable ClamAV in config:

```toml
[signatures.sources]
clamav = true
```

## Managing Imported Hashes

View imported hash sets:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

Remove an imported set:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## Next Steps

- [Custom YARA Rules](./custom-rules) -- write pattern-based detection rules
- [Signature Sources](./sources) -- all available threat intelligence sources
- [Update Signatures](./update) -- keep databases current
- [Threat Intelligence Overview](./index) -- database architecture
