---
title: YARA Rules
description: PRX-SD uses YARA-X to scan files against 38,800+ rules from 8 sources including community repositories, commercial-grade rule sets, and 64 built-in rules.
---

# YARA Rules

YARA rules are the second layer in the PRX-SD detection pipeline. While hash matching catches exact copies of known malware, YARA rules detect malware **families**, **variants**, and **behavioral patterns** by matching byte sequences, strings, and structural conditions within files.

PRX-SD ships with 38,800+ YARA rules aggregated from 8 sources and uses the **YARA-X** engine -- the next-generation Rust rewrite of YARA that provides improved performance, safety, and compatibility.

## YARA-X Engine

PRX-SD uses [YARA-X](https://github.com/VirusTotal/yara-x) instead of the traditional C-based YARA library. Key advantages:

| Feature | YARA (C) | YARA-X (Rust) |
|---------|----------|---------------|
| Language | C | Rust (memory-safe) |
| Performance | Good | 2-5x faster on large rule sets |
| Rule compatibility | Baseline | Full backward compatibility + new features |
| Thread safety | Requires careful handling | Safe by design |
| Module support | Built-in modules | Modular, extensible |

## Rule Sources

PRX-SD aggregates rules from 8 sources:

| Source | Rules | Content | Platform Coverage |
|--------|-------|---------|-------------------|
| **Built-in rules** | 64 | Ransomware, trojans, backdoors, rootkits, miners, webshells | Linux + macOS + Windows |
| **Yara-Rules/rules** (GitHub) | ~12,400 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit | Cross-platform |
| **Neo23x0/signature-base** | ~8,200 | APT29, Lazarus, crypto mining, webshells, ransomware | Cross-platform |
| **ReversingLabs YARA** | ~9,500 | Trojans, ransomware, backdoors, hack tools | Windows + Linux |
| **ESET IOC** | ~3,800 | Turla, Interception, advanced persistent threats | Cross-platform |
| **InQuest** | ~4,836 | OLE/DDE malicious documents, macro payloads | Cross-platform |
| **JPCERT/CC** | ~500+ | Asia-Pacific targeted threats | Cross-platform |
| **Custom/imported** | Variable | User-provided rules | Any |

**Total: 38,800+ rules** (after deduplication)

## Built-in Rules

The 64 built-in rules are compiled into the PRX-SD binary and are always available, even without downloading external rule sets. They cover the most prevalent threat categories:

| Category | Rules | Examples |
|----------|-------|---------|
| Ransomware | 12 | WannaCry, LockBit, Conti, REvil, BlackCat, Ryuk |
| Trojans | 10 | Emotet, TrickBot, Dridex, QakBot |
| Backdoors | 8 | Cobalt Strike Beacon, Metasploit Meterpreter, reverse shells |
| Rootkits | 6 | Reptile, Diamorphine, Jynx2 (Linux) |
| Cryptominers | 6 | XMRig, CGMiner, hidden mining configs |
| Webshells | 8 | China Chopper, WSO, B374K, PHP/ASP/JSP shells |
| RATs | 6 | njRAT, DarkComet, AsyncRAT, Quasar |
| Exploits | 4 | EternalBlue, PrintNightmare, Log4Shell payloads |
| Test signatures | 4 | EICAR test file variants |

## Rule Matching Process

When a file reaches Layer 2, YARA-X processes it as follows:

1. **Rule compilation** -- On startup, all rules are compiled into an optimized internal representation. This happens once and is cached in memory.
2. **Atom extraction** -- YARA-X extracts short byte sequences (atoms) from rule patterns to build a search index. This enables fast pre-filtering.
3. **Scanning** -- The file content is scanned against the atom index. Only rules with matching atoms are fully evaluated.
4. **Condition evaluation** -- For each candidate rule, the full condition (boolean logic, string counts, file structure checks) is evaluated.
5. **Result** -- Matching rules are collected and the file is marked as `MALICIOUS` with the rule names included in the report.

### Performance

| Metric | Value |
|--------|-------|
| Rule compilation (38,800 rules) | ~2 seconds (one-time at startup) |
| Per-file scan time | ~0.3 milliseconds average |
| Memory usage (compiled rules) | ~150 MB |
| Throughput | ~3,000 files/second/thread |

## Updating YARA Rules

Rules are updated alongside hash signatures:

```bash
# Update everything (hashes + YARA rules)
sd update

# Update only YARA rules
sd update --source yara
```

The update process:

1. Downloads rule archives from each source
2. Validates rule syntax with YARA-X
3. Deduplicates rules by name and content hash
4. Compiles the combined rule set
5. Atomically replaces the active rule set

::: tip Zero-Downtime Updates
Rule updates are atomic. The new rule set is compiled and validated before replacing the active one. If compilation fails (e.g., due to a syntax error in a community rule), the existing rule set remains active.
:::

## Custom Rules

You can add your own YARA rules by placing `.yar` or `.yara` files in the custom rules directory:

```bash
# Default custom rules directory
~/.config/prx-sd/rules/
```

Example custom rule:

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

After adding custom rules, reload the rule set:

```bash
sd reload-rules
```

Or restart the monitor daemon to pick up changes automatically.

## Rule Directories

| Directory | Source | Update Behavior |
|-----------|--------|----------------|
| `~/.local/share/prx-sd/rules/builtin/` | Compiled into binary | Updated with releases |
| `~/.local/share/prx-sd/rules/community/` | Downloaded from sources | Updated by `sd update` |
| `~/.config/prx-sd/rules/` | User-provided custom rules | Manual, never overwritten |

## Verifying Rules

Check the currently loaded rule count and sources:

```bash
sd info
```

```
YARA Rules
==========
Built-in:        64
Community:       38,736
Custom:          12
Total compiled:  38,812
Rule sources:    8
Last updated:    2026-03-21 10:00:00 UTC
```

List rules matching a specific keyword:

```bash
sd rules list --filter "ransomware"
```

## Next Steps

- [Heuristic Analysis](./heuristics) -- Behavioral detection for files that evade signatures
- [Hash Matching](./hash-matching) -- The fastest detection layer
- [Detection Engine Overview](./index) -- How all layers work together
- [Supported File Types](./file-types) -- Which file formats YARA rules target
