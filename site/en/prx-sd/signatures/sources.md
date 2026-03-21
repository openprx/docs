---
title: Signature Sources
description: Detailed information on every threat intelligence source integrated into PRX-SD, including update frequency and coverage.
---

# Signature Sources

PRX-SD aggregates threat intelligence from over 20 open-source and community sources. This page provides detailed information on each source, its coverage, update frequency, and data type.

## abuse.ch Sources

The abuse.ch project provides several high-quality, freely available threat feeds:

| Source | Data Type | Content | Update Frequency | License |
|--------|-----------|---------|-----------------|---------|
| **MalwareBazaar** | SHA-256 | Malware samples submitted by researchers worldwide. Rolling 48-hour window of the latest submissions. | Every 5 minutes | CC0 |
| **URLhaus** | SHA-256 | File hashes associated with URLs distributing malware. Covers drive-by downloads, phishing payloads, and exploit kit drops. | Hourly | CC0 |
| **Feodo Tracker** | SHA-256 | Banking trojans and loaders: Emotet, Dridex, TrickBot, QakBot, BazarLoader, IcedID. | Every 5 minutes | CC0 |
| **ThreatFox** | SHA-256 | Community-submitted IOCs spanning multiple malware families. Includes file hashes, domains, and IPs. | Hourly | CC0 |
| **SSL Blacklist** | SHA-1 (cert) | SHA-1 fingerprints of SSL certificates used by botnet C2 servers. Used for network IOC matching. | Daily | CC0 |

::: tip
All abuse.ch feeds are available without registration or API keys. PRX-SD downloads them directly from the public API endpoints.
:::

## VirusShare

| Field | Details |
|-------|---------|
| **Data Type** | MD5 hashes |
| **Count** | 20,000,000+ |
| **Content** | One of the largest public malware hash repositories. Contains MD5 hashes organized in numbered list files (VirusShare_00000.md5 through VirusShare_00500+.md5). |
| **Update Frequency** | New list files added periodically |
| **Access** | Free (requires `--full` flag due to download size) |
| **License** | Free for non-commercial use |

::: warning
The full VirusShare download is approximately 500 MB and takes significant time to import. Use `sd update --full` to include it, or `sd update` for standard updates without VirusShare.
:::

## YARA Rule Sources

| Source | Rule Count | Focus Area | Quality |
|--------|-----------|------------|---------|
| **Built-in Rules** | 64 | Ransomware, trojans, backdoors, rootkits, miners, webshells across Linux, macOS, Windows | Curated by PRX-SD team |
| **Yara-Rules/rules** | Community | Emotet, TrickBot, CobaltStrike, Mirai, LockBit, APTs | Community-maintained |
| **Neo23x0/signature-base** | High volume | APT29, Lazarus Group, crypto mining, webshells, ransomware families | High quality, Florian Roth |
| **ReversingLabs YARA** | Commercial-grade | Trojans, ransomware, backdoors, hack tools, exploits | Professional-grade, open-source |
| **Elastic Security** | Growing | Endpoint detection rules covering Windows, Linux, macOS threats | Elastic threat research team |
| **Google GCTI** | Selective | High-confidence rules from Google Cloud Threat Intelligence | Very high quality |
| **ESET IOC** | Selective | APT tracking: Turla, Interception, InvisiMole, and other advanced threats | APT-focused |
| **InQuest** | Specialized | Malicious documents: OLE exploits, DDE injection, macro-based malware | Document-specific |

### YARA Rule Categories

The combined rule set covers these malware categories:

| Category | Example Families | Platform Coverage |
|----------|-----------------|------------------|
| Ransomware | WannaCry, LockBit, Conti, REvil, Akira, BlackCat | Windows, Linux |
| Trojans | Emotet, TrickBot, QakBot, Agent Tesla, RedLine | Windows |
| Backdoors | CobaltStrike, Metasploit, ShadowPad, PlugX | Cross-platform |
| Rootkits | Reptile, Diamorphine, Horse Pill | Linux |
| Miners | XMRig, CCMiner variants | Cross-platform |
| Webshells | China Chopper, WSO, b374k, c99, r57 | Cross-platform |
| APTs | APT29, Lazarus, Turla, Sandworm, OceanLotus | Cross-platform |
| Exploits | EternalBlue, PrintNightmare, Log4Shell payloads | Cross-platform |
| Hack Tools | Mimikatz, Rubeus, BloodHound, Impacket | Windows |
| Documents | Malicious Office macros, PDF exploits, RTF exploits | Cross-platform |

## IOC Feed Sources

| Source | Indicator Type | Count | Content | Update Frequency |
|--------|---------------|-------|---------|-----------------|
| **IPsum** | IP addresses | 150,000+ | Aggregated malicious IP reputation from 50+ blocklists. Multi-level scoring (level 1-8 based on number of lists citing the IP). | Daily |
| **FireHOL** | IP addresses | 200,000+ | Curated IP blocklists organized by threat level (level1 through level4). Higher levels have stricter inclusion criteria. | Every 6 hours |
| **Emerging Threats** | IP addresses | 100,000+ | IPs extracted from Suricata and Snort IDS rules. Covers botnet C2, scanning, brute force, exploit attempts. | Daily |
| **SANS ISC** | IP addresses | 50,000+ | Suspicious IPs from the Internet Storm Center's DShield sensor network. | Daily |
| **URLhaus (URLs)** | URLs | 85,000+ | Active malicious URLs used for malware distribution, phishing, and exploit delivery. | Hourly |

## ClamAV Database

| Field | Details |
|-------|---------|
| **Data Type** | Multi-format signatures (hash, bytecode, regex, logical) |
| **Count** | 11,000,000+ signatures |
| **Files** | `main.cvd` (core), `daily.cvd` (daily updates), `bytecode.cvd` (bytecode rules) |
| **Content** | The largest open-source virus signature database. Covers viruses, trojans, worms, phishing, PUAs. |
| **Update Frequency** | Multiple times daily |
| **Access** | Free via freshclam or direct download |

To enable ClamAV integration:

```bash
# Import ClamAV databases
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

See [Import Hashes](./import) for detailed ClamAV import instructions.

## Source Configuration

Enable or disable individual sources in `config.toml`:

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # Enable with sd update --full
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # Enable after importing ClamAV DBs
```

## Next Steps

- [Update Signatures](./update) -- download and update all sources
- [Import Hashes](./import) -- add custom hashes and ClamAV databases
- [Custom YARA Rules](./custom-rules) -- write your own detection rules
- [Threat Intelligence Overview](./index) -- architecture and data directory layout
