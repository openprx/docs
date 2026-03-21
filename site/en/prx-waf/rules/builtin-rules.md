---
title: Built-in Rules
description: PRX-WAF ships with 398 YAML rules covering OWASP CRS, ModSecurity community rules, and targeted CVE virtual patches. Full inventory and category breakdown.
---

# Built-in Rules

PRX-WAF ships with 398 pre-built rules across three categories, plus 10+ detection checkers compiled into the binary. Together, they provide comprehensive coverage of the OWASP Top 10 and known CVE exploits.

## OWASP Core Rule Set (310 rules)

The OWASP CRS rules are converted from the [OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset) into PRX-WAF's native YAML format. They cover the most common web attack vectors:

| File | CRS IDs | Rules | Category |
|------|---------|-------|----------|
| `sqli.yaml` | 942xxx | ~87 | SQL injection |
| `xss.yaml` | 941xxx | ~41 | Cross-site scripting |
| `rce.yaml` | 932xxx | ~30 | Remote code execution |
| `lfi.yaml` | 930xxx | ~20 | Local file inclusion |
| `rfi.yaml` | 931xxx | ~12 | Remote file inclusion |
| `php-injection.yaml` | 933xxx | ~18 | PHP injection |
| `java-injection.yaml` | 944xxx | ~15 | Java / Expression Language injection |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js, SSI, HTTP splitting |
| `scanner-detection.yaml` | 913xxx | ~10 | Security scanner UA detection |
| `protocol-enforcement.yaml` | 920xxx | ~15 | HTTP protocol compliance |
| `protocol-attack.yaml` | 921xxx | ~10 | Request smuggling, CRLF injection |
| `multipart-attack.yaml` | 922xxx | ~8 | Multipart bypass |
| `method-enforcement.yaml` | 911xxx | ~5 | HTTP method allowlist |
| `session-fixation.yaml` | 943xxx | ~6 | Session fixation |
| `web-shells.yaml` | 955xxx | ~8 | Web shell detection |
| `response-*.yaml` | 950-956xxx | ~13 | Response inspection |

### Wordlist Data Files

The OWASP CRS rules use phrase-match (`pm_from_file`) against 20+ wordlist files stored in `rules/owasp-crs/data/`:

- `scanners-user-agents.data` -- Known scanner user-agent strings
- `lfi-os-files.data` -- Sensitive OS file paths
- `sql-errors.data` -- Database error message patterns
- And more

## ModSecurity Community Rules (46 rules)

Hand-crafted rules for threat categories not fully covered by the OWASP CRS:

| File | Rules | Category |
|------|-------|----------|
| `ip-reputation.yaml` | ~15 | Bot/scanner/proxy IP detection |
| `dos-protection.yaml` | ~12 | DoS and abnormal request patterns |
| `data-leakage.yaml` | ~10 | PII and credential leak detection |
| `response-checks.yaml` | ~9 | Response body inspection |

## CVE Virtual Patches (39 rules)

Targeted detection rules for high-profile CVEs. These act as virtual patches, blocking exploit attempts before they reach vulnerable applications:

| File | CVE(s) | Description |
|------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | Apache Log4j RCE via JNDI lookup |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | Spring Framework RCE |
| `2022-text4shell.yaml` | CVE-2022-42889 | Apache Commons Text RCE |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | MOVEit Transfer SQL injection |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | XZ Utils backdoor detection |
| `2024-recent.yaml` | Various | 2024 high-profile CVEs |
| `2025-recent.yaml` | Various | 2025 high-profile CVEs |

::: tip
CVE patch rules are set to paranoia level 1 by default, meaning they are active in all configurations. They have very low false positive rates because they target specific exploit payloads.
:::

## Built-in Detection Checkers

In addition to YAML rules, PRX-WAF includes detection checkers compiled into the binary. These run in dedicated phases of the detection pipeline:

| Phase | Checker | Description |
|-------|---------|-------------|
| 1-4 | IP Allowlist/Blocklist | CIDR-based IP filtering |
| 5 | CC/DDoS Rate Limiter | Sliding-window rate limiting per IP |
| 6 | Scanner Detection | Vulnerability scanner fingerprints (Nmap, Nikto, etc.) |
| 7 | Bot Detection | Malicious bots, AI crawlers, headless browsers |
| 8 | SQL Injection | libinjection + regex patterns |
| 9 | XSS | libinjection + regex patterns |
| 10 | RCE / Command Injection | OS command injection patterns |
| 11 | Directory Traversal | Path traversal (`../`) detection |
| 14 | Sensitive Data | Aho-Corasick multi-pattern PII/credential detection |
| 15 | Anti-Hotlinking | Referer-based validation per host |
| 16 | CrowdSec | Bouncer decisions + AppSec inspection |

## Updating Rules

Rules can be synced from upstream sources using the included tools:

```bash
# Check for updates
python rules/tools/sync.py --check

# Sync OWASP CRS to a specific release
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Sync to latest
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Hot-reload after updating
prx-waf rules reload
```

## Rule Statistics

View current rule statistics via the CLI:

```bash
prx-waf rules stats
```

Example output:

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## Next Steps

- [Custom Rules](./custom-rules) -- Write your own rules
- [YAML Syntax](./yaml-syntax) -- Complete rule schema reference
- [Rule Engine Overview](./index) -- How the pipeline evaluates rules
