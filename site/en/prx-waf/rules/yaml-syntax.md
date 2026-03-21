---
title: YAML Rule Syntax
description: Complete reference for the PRX-WAF YAML rule format. Schema, field reference, operator reference, action reference, and annotated examples.
---

# YAML Rule Syntax

This page documents the complete YAML rule schema used by PRX-WAF. Every rule file follows this structure.

## File Structure

Each YAML rule file has a top-level metadata section followed by a list of rules:

```yaml
version: "1.0"                     # Schema version (required)
description: "Short description"   # Human-readable label (required)
source: "OWASP CRS v4.25.0"       # Origin of the rules (optional)
license: "Apache-2.0"             # SPDX license identifier (optional)

rules:
  - <rule>
  - <rule>
```

## Rule Schema

Each rule in the `rules` list has the following fields:

```yaml
- id: "CRS-942100"              # Unique string ID (REQUIRED)
  name: "SQL injection attack"  # Short description (REQUIRED)
  category: "sqli"              # Category tag (REQUIRED)
  severity: "critical"          # Severity level (REQUIRED)
  paranoia: 1                   # Paranoia level 1-4 (optional, default: 1)
  field: "all"                  # Request field to inspect (REQUIRED)
  operator: "regex"             # Match operator (REQUIRED)
  value: "(?i)select.+from"     # Pattern or threshold (REQUIRED)
  action: "block"               # Action on match (REQUIRED)
  tags:                         # String tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Original CRS numeric ID (optional)
  reference: "https://..."      # CVE or documentation link (optional)
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier across all rule files. Format: `<PREFIX>-<CATEGORY>-<NNN>` |
| `name` | `string` | Short human-readable description (max ~120 chars) |
| `category` | `string` | Category tag for filtering and reporting |
| `severity` | `string` | One of: `critical`, `high`, `medium`, `low`, `info`, `notice`, `warning`, `error`, `unknown` |
| `field` | `string` | Which part of the request to inspect (see Field Reference) |
| `operator` | `string` | How to match the value (see Operator Reference) |
| `value` | `string` | Pattern, threshold, or wordlist filename |
| `action` | `string` | What to do when the rule matches (see Action Reference) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `paranoia` | `integer` | `1` | Paranoia level 1-4 |
| `tags` | `string[]` | `[]` | Tags for filtering and dashboard display |
| `crs_id` | `integer` | -- | Original OWASP CRS numeric ID |
| `reference` | `string` | -- | URL to CVE, OWASP article, or rationale |

## Field Reference

The `field` value determines which part of the HTTP request is inspected:

| Field | Inspects |
|-------|----------|
| `path` | Request URI path (without query string) |
| `query` | Query string (all parameters, decoded) |
| `body` | Request body (decoded) |
| `headers` | All request headers (name: value pairs) |
| `user_agent` | User-Agent header only |
| `cookies` | Request cookies |
| `method` | HTTP method (GET, POST, PUT, etc.) |
| `content_type` | Content-Type header |
| `content_length` | Content-Length value (for numeric comparison) |
| `path_length` | Length of the URI path (for numeric comparison) |
| `query_arg_count` | Number of query parameters (for numeric comparison) |
| `all` | All of the above fields combined |

## Operator Reference

The `operator` value determines how the `value` is matched against the inspected field:

| Operator | Description | Value Format |
|----------|-------------|--------------|
| `regex` | PCRE-compatible regular expression | Regex pattern |
| `contains` | Field contains the literal string | Literal string |
| `equals` | Field exactly equals value (case-sensitive) | Literal string |
| `not_in` | Field value is NOT in the list | Comma-separated list |
| `gt` | Field value (numeric) is greater than | Number string |
| `lt` | Field value (numeric) is less than | Number string |
| `ge` | Field value (numeric) is greater than or equal | Number string |
| `le` | Field value (numeric) is less than or equal | Number string |
| `detect_sqli` | SQL injection detection via libinjection | `"true"` or `""` |
| `detect_xss` | XSS detection via libinjection | `"true"` or `""` |
| `pm_from_file` | Phrase-match against wordlist file | Filename in `owasp-crs/data/` |
| `pm` | Phrase-match against inline list | Comma-separated phrases |

## Action Reference

The `action` value determines what happens when a rule matches:

| Action | Description |
|--------|-------------|
| `block` | Reject the request with a 403 Forbidden response |
| `log` | Allow the request but log the match (monitoring mode) |
| `allow` | Explicitly allow the request (overrides other rules) |
| `deny` | Alias for `block` |
| `redirect` | Redirect the request (engine-specific configuration) |
| `drop` | Silently drop the connection |

::: tip
Start new rules with `action: log` to monitor for false positives before switching to `action: block`.
:::

## ID Namespace Convention

Rule IDs should follow the established prefix convention:

| Directory | ID Prefix | Example |
|-----------|-----------|---------|
| `owasp-crs/` | `CRS-<number>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORY>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<YEAR>-<SHORT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORY>-<NNN>` | `CUSTOM-API-001` |

## Complete Example

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Rule Validation

Validate your rule files before deploying:

```bash
# Validate all rules
python rules/tools/validate.py rules/

# Validate a specific file
python rules/tools/validate.py rules/custom/myapp.yaml
```

The validator checks for:
- Required fields are present
- No duplicate rule IDs across all files
- Severity and action values are valid
- Paranoia levels are in range 1-4
- Regexes compile correctly
- Numeric operators are not used with string values

## Next Steps

- [Built-in Rules](./builtin-rules) -- Explore the OWASP CRS and CVE patch rules
- [Custom Rules](./custom-rules) -- Write your own rules step by step
- [Rule Engine Overview](./index) -- How the detection pipeline processes rules
