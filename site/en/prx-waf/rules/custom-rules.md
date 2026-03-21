---
title: Custom Rules
description: Write custom detection rules for PRX-WAF. Step-by-step guide with examples for access control, bot blocking, rate limiting, and application-specific protection.
---

# Custom Rules

PRX-WAF makes it straightforward to write custom detection rules tailored to your specific application. Custom rules are written in YAML and placed in the `rules/custom/` directory.

## Getting Started

1. Create a new YAML file in `rules/custom/`:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. Edit the file following the [YAML rule schema](./yaml-syntax).

3. Validate before deploying:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. Rules are hot-reloaded automatically, or trigger a manual reload:

```bash
prx-waf rules reload
```

## Example: Block Access to Internal Paths

Prevent external access to internal API endpoints:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## Example: Detect Suspicious User-Agents

Log requests from automated tools for monitoring:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## Example: Rate Limit by Query Parameters

Block requests with an excessive number of query parameters (common in DoS attacks):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Example: Block Specific File Extensions

Prevent access to backup or configuration files:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## Example: Detect Credential Stuffing

Detect rapid-fire login attempts (useful alongside the built-in rate limiter):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## Example: CVE Virtual Patch

Create a quick virtual patch for a specific vulnerability:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Using Rhai Scripts for Complex Logic

For rules that require more than pattern matching, PRX-WAF supports Rhai scripting in Phase 12:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Rhai scripts run in a sandboxed environment. They cannot access the filesystem, network, or any system resources outside the request context.
:::

## Best Practices

1. **Start with `action: log`** -- Monitor before blocking to catch false positives early.

2. **Use specific regex anchors** -- Use `^` and `$` to prevent partial matches that cause false positives.

3. **Set appropriate paranoia levels** -- If a rule might match legitimate traffic, set paranoia to 2 or 3 instead of blocking at level 1.

4. **Use non-capturing groups** -- Use `(?:...)` instead of `(...)` for clarity and performance.

5. **Add descriptive tags** -- Tags appear in the admin UI and help with filtering security events.

6. **Include references** -- Add a `reference` URL linking to the relevant CVE, OWASP article, or internal documentation.

7. **Test your regex** -- Validate regex patterns before deploying:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **Validate before deploying** -- Always run the validator:

```bash
python rules/tools/validate.py rules/custom/
```

## Importing via CLI

You can also import rules from files or URLs using the CLI:

```bash
# Import from a local file
prx-waf rules import /path/to/rules.yaml

# Import from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Validate a rule file
prx-waf rules validate /path/to/rules.yaml
```

## Importing ModSecurity Rules

Convert existing ModSecurity `.conf` rules to PRX-WAF YAML format:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
The ModSecurity converter supports a basic subset of SecRule directives (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY). Complex ModSecurity rules with chaining or Lua scripts are not supported and need to be rewritten manually.
:::

## Next Steps

- [YAML Syntax](./yaml-syntax) -- Complete rule schema reference
- [Built-in Rules](./builtin-rules) -- Review existing rules before writing new ones
- [Rule Engine Overview](./index) -- Understand how rules are evaluated in the pipeline
