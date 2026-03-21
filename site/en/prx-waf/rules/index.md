---
title: Rule Engine Overview
description: How the PRX-WAF rule engine works. YAML-based declarative rules, multiple rule sources, paranoia levels, hot-reload, and the 16-phase detection pipeline.
---

# Rule Engine

PRX-WAF uses a declarative, YAML-based rule engine to detect and block web attacks. Rules describe what to inspect, how to match, and what action to take. The engine evaluates every incoming request against all enabled rules across 16 sequential detection phases.

## How Rules Work

Each rule consists of four key components:

1. **Field** -- Which part of the request to inspect (path, query, body, headers, etc.)
2. **Operator** -- How to match the value (regex, contains, detect_sqli, etc.)
3. **Value** -- The pattern or threshold to match against
4. **Action** -- What to do when the rule matches (block, log, allow)

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## Rule Sources

PRX-WAF ships with 398 rules across four categories:

| Source | Files | Rules | Description |
|--------|-------|-------|-------------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4 (converted to YAML) |
| ModSecurity | 4 | 46 | Community rules for IP reputation, DoS, data leakage |
| CVE Patches | 7 | 39 | Targeted virtual patches for Log4Shell, Spring4Shell, MOVEit, etc. |
| Custom | 1 | 3 | Example templates for application-specific rules |

Additionally, PRX-WAF includes 10+ built-in detection checkers compiled into the binary:

- SQL injection (libinjection + regex)
- Cross-site scripting (libinjection + regex)
- Remote code execution / command injection
- Local/remote file inclusion
- Server-side request forgery (SSRF)
- Path/directory traversal
- Scanner detection (Nmap, Nikto, etc.)
- Bot detection (malicious bots, AI crawlers, headless browsers)
- Protocol violation detection
- Sensitive word detection (Aho-Corasick multi-pattern matching)

## Rule Formats

PRX-WAF supports three rule file formats:

| Format | Extension | Description |
|--------|-----------|-------------|
| YAML | `.yaml`, `.yml` | Native PRX-WAF format (recommended) |
| ModSecurity | `.conf` | SecRule directives (basic subset: ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY) |
| JSON | `.json` | JSON array of rule objects |

See [YAML Syntax](./yaml-syntax) for the complete schema reference.

## Paranoia Levels

Each rule declares a paranoia level (1-4) that controls how aggressively it matches. Higher levels catch more attacks but increase false positive risk.

| Level | Name | Description | False Positive Risk |
|-------|------|-------------|---------------------|
| 1 | Default | High-confidence rules, production-safe | Very low |
| 2 | Recommended | Broader coverage, minor FP risk | Low |
| 3 | Aggressive | Extensive heuristics, requires tuning | Moderate |
| 4 | Maximum | Everything, including speculative patterns | High |

::: tip
Start with paranoia level 1 in production. Monitor logs, tune exclusions, then gradually enable higher levels.
:::

## Hot-Reload

PRX-WAF watches the `rules/` directory for file changes and automatically reloads rules when a file is created, modified, or deleted. Changes take effect within the configured debounce window (default: 500ms).

You can also trigger a reload manually:

```bash
# Via CLI
prx-waf rules reload

# Via SIGHUP (Unix only)
kill -HUP $(pgrep prx-waf)
```

Rule reloads are atomic -- the old rule set continues to serve traffic until the new set is fully compiled and ready.

## Directory Layout

```
rules/
├── owasp-crs/          # OWASP CRS v4 (21 files, 310 rules)
│   ├── sqli.yaml       # SQL injection (CRS 942xxx)
│   ├── xss.yaml        # Cross-site scripting (CRS 941xxx)
│   ├── rce.yaml        # Remote code execution (CRS 932xxx)
│   └── ...
├── modsecurity/        # ModSecurity community rules
├── cve-patches/        # CVE virtual patches (Log4Shell, Spring4Shell, etc.)
├── custom/             # Your application-specific rules
└── tools/              # Rule validation and sync utilities
```

## Next Steps

- [YAML Syntax](./yaml-syntax) -- Complete rule schema reference
- [Built-in Rules](./builtin-rules) -- Detailed coverage of OWASP CRS and CVE patches
- [Custom Rules](./custom-rules) -- Write your own detection rules
