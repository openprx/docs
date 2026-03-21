---
title: Threat Intelligence Overview
description: Architecture of the PRX-SD signature database including hash signatures, YARA rules, IOC feeds, and ClamAV integration.
---

# Threat Intelligence Overview

PRX-SD aggregates threat intelligence from multiple open-source and community sources into a unified local database. This multi-layered approach ensures broad coverage -- from known malware hashes to behavioral pattern rules to network indicators of compromise.

## Signature Categories

PRX-SD organizes threat intelligence into four categories:

| Category | Sources | Count | Lookup Speed | Storage |
|----------|---------|-------|-------------|---------|
| **Hash Signatures** | 7 sources | Millions of SHA-256/MD5 | O(1) via LMDB | ~500 MB |
| **YARA Rules** | 8 sources | 38,800+ rules | Pattern matching | ~15 MB |
| **IOC Feeds** | 5 sources | 585,000+ indicators | Trie / hash map | ~25 MB |
| **ClamAV Database** | 1 source | 11,000,000+ signatures | ClamAV engine | ~300 MB |

### Hash Signatures

The fastest detection layer. Each file is hashed on scan and checked against a local LMDB database containing known-malicious file hashes:

- **abuse.ch MalwareBazaar** -- SHA-256 hashes of recent malware samples (48h rolling window)
- **abuse.ch URLhaus** -- SHA-256 hashes of files distributed via malicious URLs
- **abuse.ch Feodo Tracker** -- SHA-256 hashes of banking trojans (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- SHA-256 IOCs from community submissions
- **abuse.ch SSL Blacklist** -- SHA-1 fingerprints of malicious SSL certificates
- **VirusShare** -- 20,000,000+ MD5 hashes (available with `--full` update)
- **Built-in blocklist** -- hardcoded hashes for EICAR test file, WannaCry, NotPetya, Emotet

### YARA Rules

Pattern-matching rules that identify malware by code patterns, strings, and structure rather than exact hashes. This catches variants and families of malware:

- **Built-in rules** -- 64 curated rules for ransomware, trojans, backdoors, rootkits, miners, webshells
- **Yara-Rules/rules** -- community-maintained rules for Emotet, TrickBot, CobaltStrike, Mirai, LockBit
- **Neo23x0/signature-base** -- high-quality rules for APT29, Lazarus, crypto mining, webshells
- **ReversingLabs YARA** -- commercial-grade open-source rules for trojans, ransomware, backdoors
- **ESET IOC** -- APT tracking rules for Turla, Interception, and other advanced threats
- **InQuest** -- specialized rules for malicious documents (OLE, DDE exploits)
- **Elastic Security** -- detection rules from Elastic's threat research team
- **Google GCTI** -- YARA rules from Google Cloud Threat Intelligence

### IOC Feeds

Network indicators of compromise for detecting connections to known-malicious infrastructure:

- **IPsum** -- aggregated malicious IP reputation list (multi-source scoring)
- **FireHOL** -- curated IP blocklists at multiple threat levels
- **Emerging Threats** -- Suricata/Snort rules converted to IP/domain IOCs
- **SANS ISC** -- daily suspicious IP feeds from the Internet Storm Center
- **URLhaus** -- active malicious URLs for phishing, malware distribution

### ClamAV Database

Optional integration with the ClamAV virus database, which provides the largest open-source signature set:

- **main.cvd** -- core virus signatures
- **daily.cvd** -- daily updated signatures
- **bytecode.cvd** -- bytecode detection signatures

## Data Directory Structure

All signature data is stored under `~/.prx-sd/signatures/`:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full only)
    custom.lmdb               # User-imported hashes
  yara/
    builtin/                  # Built-in rules (shipped with binary)
    community/                # Downloaded community rules
    custom/                   # User-written custom rules
    compiled.yarc             # Pre-compiled rule cache
  ioc/
    ipsum.dat                 # IPsum IP reputation
    firehol.dat               # FireHOL blocklists
    et_compromised.dat        # Emerging Threats IPs
    sans_isc.dat              # SANS ISC suspicious IPs
    urlhaus_urls.dat          # URLhaus malicious URLs
  clamav/
    main.cvd                  # ClamAV main signatures
    daily.cvd                 # ClamAV daily updates
    bytecode.cvd              # ClamAV bytecode sigs
  metadata.json               # Update timestamps and version info
```

::: tip
Use `sd info` to view the current state of all signature databases, including source counts, last update times, and disk usage.
:::

## Querying Signature Status

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## Next Steps

- [Update Signatures](./update) -- keep your databases current
- [Signature Sources](./sources) -- detailed information on each source
- [Import Hashes](./import) -- add your own hash blocklists
- [Custom YARA Rules](./custom-rules) -- write and deploy custom rules
