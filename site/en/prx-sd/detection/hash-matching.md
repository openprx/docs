---
title: Hash Matching
description: How PRX-SD uses LMDB for O(1) hash lookups against SHA-256 and MD5 databases from abuse.ch, VirusShare, and built-in blocklists.
---

# Hash Matching

Hash matching is the first and fastest layer in the PRX-SD detection pipeline. For every scanned file, PRX-SD computes a cryptographic hash and looks it up in a local database of known-malicious hashes. A match means the file is an exact, byte-for-byte copy of a known malware sample.

## How It Works

1. **Hash computation** -- PRX-SD computes the SHA-256 hash of the file. For VirusShare lookups, the MD5 hash is also computed.
2. **LMDB lookup** -- The hash is checked against the LMDB database using a memory-mapped B+ tree. This provides O(1) average-case lookup time.
3. **Metadata retrieval** -- If a match is found, associated metadata (source, malware family, first-seen date) is returned.
4. **Verdict** -- A hash match immediately produces a `MALICIOUS` verdict and the remaining detection layers are skipped.

### Performance

| Operation | Time |
|-----------|------|
| SHA-256 computation (1 KB file) | ~2 microseconds |
| SHA-256 computation (10 MB file) | ~15 milliseconds |
| LMDB lookup | ~0.5 microseconds |
| Total per-file (small file, hash hit) | ~3 microseconds |

LMDB uses memory-mapped files, so the operating system's page cache keeps frequently accessed portions of the database in RAM. On a system with sufficient memory, lookups are essentially free.

## Supported Hash Types

| Hash Type | Size | Usage |
|-----------|------|-------|
| **SHA-256** | 256-bit (64 hex chars) | Primary hash for all lookups. Used by abuse.ch feeds and built-in blocklist. |
| **MD5** | 128-bit (32 hex chars) | Used for VirusShare database compatibility. Computed only when VirusShare data is present. |

::: warning MD5 Limitations
MD5 is cryptographically broken and susceptible to collision attacks. PRX-SD uses MD5 only for backward compatibility with the VirusShare database. SHA-256 is the primary hash for all other sources.
:::

## Data Sources

PRX-SD aggregates hash signatures from multiple threat intelligence feeds:

| Source | Hash Type | Free | Content | Update Frequency |
|--------|-----------|------|---------|-----------------|
| abuse.ch MalwareBazaar | SHA-256 | Yes | Recent 48h malware samples | Every 5 minutes |
| abuse.ch URLhaus | SHA-256 | Yes | Malware files from malicious URLs | Hourly |
| abuse.ch Feodo Tracker | SHA-256 | Yes | Banking trojans (Emotet, Dridex, TrickBot) | Every 5 minutes |
| abuse.ch ThreatFox | SHA-256 | Yes | Community IOC sharing platform | Hourly |
| VirusShare | MD5 | Yes | 20M+ malware hashes (historical) | Periodic |
| Built-in blocklist | SHA-256 | Bundled | EICAR, WannaCry, NotPetya, Emotet, etc. | With releases |

### Total Hash Coverage

| Update Mode | Hashes | Database Size |
|-------------|--------|---------------|
| Standard (`sd update`) | ~28,000 SHA-256 | ~5 MB |
| Full (`sd update --full`) | ~28,000 SHA-256 + 20M+ MD5 | ~800 MB |

## Updating the Hash Database

### Standard Update

Fetches the latest SHA-256 hashes from all abuse.ch feeds:

```bash
sd update
```

This runs automatically when PRX-SD is first installed and can be scheduled with cron or `sd service` for continuous updates.

### Full Update

Includes the complete VirusShare MD5 database:

```bash
sd update --full
```

::: tip When to Use Full Mode
The VirusShare database contains 20M+ historical MD5 hashes going back years. It is useful for forensic investigations and comprehensive scanning but adds ~800 MB to the database. For day-to-day protection, the standard update is sufficient.
:::

### Manual Hash Import

Import custom hash lists from text files (one hash per line):

```bash
sd import my_hashes.txt
```

The import command auto-detects hash type (SHA-256 or MD5) based on string length. You can also specify metadata:

```bash
sd import my_hashes.txt --source "internal-ir" --family "custom-trojan"
```

## LMDB Database

PRX-SD stores hashes in [LMDB](http://www.lmdb.tech/doc/) (Lightning Memory-Mapped Database), chosen for its properties:

| Property | Benefit |
|----------|---------|
| Memory-mapped I/O | Zero-copy reads, no serialization overhead |
| B+ tree structure | O(1) amortized lookups |
| ACID transactions | Safe concurrent reads during updates |
| Crash-resistant | Copy-on-write prevents corruption |
| Compact size | Efficient storage of hash keys |

The database is stored at `~/.local/share/prx-sd/signatures.lmdb` by default. The path can be customized:

```toml
# ~/.config/prx-sd/config.toml
[database]
path = "/opt/prx-sd/signatures.lmdb"
```

## Checking Database Status

View current hash database statistics:

```bash
sd info
```

```
PRX-SD Signature Database
=========================
SHA-256 hashes:  28,428
MD5 hashes:      0 (run 'sd update --full' for VirusShare)
YARA rules:      38,800
Database path:   /home/user/.local/share/prx-sd/signatures.lmdb
Database size:   4.8 MB
Last updated:    2026-03-21 10:00:00 UTC
```

## How Hash Matching Fits the Pipeline

Hash matching is designed as the first line of defense because:

- **Speed** -- At ~3 microseconds per file, it adds negligible overhead. A million clean files can be checked in under 3 seconds.
- **Zero false positives** -- A SHA-256 match is a cryptographic guarantee that the file is identical to a known malware sample.
- **Short-circuit** -- When a hash match is found, YARA and heuristic analysis are skipped entirely, saving significant processing time.

The limitation of hash matching is that it only detects **exact copies** of known samples. A single-byte modification produces a different hash and evades this layer. This is why the YARA and heuristic layers exist as subsequent defenses.

## Next Steps

- [YARA Rules](./yara-rules) -- Pattern-based detection for variants and families
- [Heuristic Analysis](./heuristics) -- Behavioral detection for unknown threats
- [Detection Engine Overview](./index) -- How all layers work together
- [File & Directory Scanning](../scanning/file-scan) -- Using hash matching in practice
