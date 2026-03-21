---
title: CLI Command Reference
description: Complete reference for all PRX-WAF CLI commands and subcommands. Server management, rule operations, CrowdSec integration, and bot detection.
---

# CLI Command Reference

The `prx-waf` command-line interface provides commands for server management, rule operations, CrowdSec integration, and bot detection.

## Global Options

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | Path to the TOML configuration file |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## Server Commands

| Command | Description |
|---------|-------------|
| `prx-waf run` | Start the reverse proxy + management API (blocks forever) |
| `prx-waf migrate` | Run database migrations only |
| `prx-waf seed-admin` | Create the default admin user (admin/admin) |

```bash
# Start the server
prx-waf -c configs/default.toml run

# Run migrations before first start
prx-waf -c configs/default.toml migrate

# Create admin user
prx-waf -c configs/default.toml seed-admin
```

::: tip
For first-time setup, run `migrate` and `seed-admin` before `run`. Subsequent starts only need `run` -- migrations are checked automatically.
:::

## Rule Management

Commands for managing detection rules. All rule commands operate on the configured rules directory.

| Command | Description |
|---------|-------------|
| `prx-waf rules list` | List all loaded rules |
| `prx-waf rules list --category <CAT>` | Filter rules by category |
| `prx-waf rules list --source <SRC>` | Filter rules by source |
| `prx-waf rules info <RULE-ID>` | Show detailed information about a rule |
| `prx-waf rules enable <RULE-ID>` | Enable a disabled rule |
| `prx-waf rules disable <RULE-ID>` | Disable a rule |
| `prx-waf rules reload` | Hot-reload all rules from disk |
| `prx-waf rules validate <PATH>` | Validate a rule file for correctness |
| `prx-waf rules import <PATH\|URL>` | Import rules from a file or URL |
| `prx-waf rules export [--format yaml]` | Export current rule set |
| `prx-waf rules update` | Fetch latest rules from remote sources |
| `prx-waf rules search <QUERY>` | Search rules by name or description |
| `prx-waf rules stats` | Display rule statistics |

### Examples

```bash
# List all SQL injection rules
prx-waf rules list --category sqli

# List OWASP CRS rules
prx-waf rules list --source owasp

# Show details for a specific rule
prx-waf rules info CRS-942100

# Disable a rule causing false positives
prx-waf rules disable CRS-942100

# Hot-reload after editing rules
prx-waf rules reload

# Validate custom rules before deploying
prx-waf rules validate rules/custom/myapp.yaml

# Import rules from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Export all rules as YAML
prx-waf rules export --format yaml > all-rules.yaml

# View statistics
prx-waf rules stats
```

## Rule Source Management

Commands for managing remote rule sources.

| Command | Description |
|---------|-------------|
| `prx-waf sources list` | List configured rule sources |
| `prx-waf sources add <NAME> <URL>` | Add a remote rule source |
| `prx-waf sources remove <NAME>` | Remove a rule source |
| `prx-waf sources update [NAME]` | Fetch latest from a specific source (or all) |
| `prx-waf sources sync` | Synchronize all remote sources |

### Examples

```bash
# List all sources
prx-waf sources list

# Add a custom source
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Sync all sources
prx-waf sources sync

# Update a specific source
prx-waf sources update owasp-crs
```

## CrowdSec Integration

Commands for managing the CrowdSec threat intelligence integration.

| Command | Description |
|---------|-------------|
| `prx-waf crowdsec status` | Show CrowdSec integration status |
| `prx-waf crowdsec decisions` | List active decisions from LAPI |
| `prx-waf crowdsec test` | Test LAPI connectivity |
| `prx-waf crowdsec setup` | Interactive CrowdSec setup wizard |

### Examples

```bash
# Check integration status
prx-waf crowdsec status

# List active block/captcha decisions
prx-waf crowdsec decisions

# Test connectivity to CrowdSec LAPI
prx-waf crowdsec test

# Run the setup wizard
prx-waf crowdsec setup
```

## Bot Detection

Commands for managing bot detection rules.

| Command | Description |
|---------|-------------|
| `prx-waf bot list` | List known bot signatures |
| `prx-waf bot add <PATTERN> [--action ACTION]` | Add a bot detection pattern |
| `prx-waf bot remove <PATTERN>` | Remove a bot detection pattern |
| `prx-waf bot test <USER-AGENT>` | Test a user-agent against bot rules |

### Examples

```bash
# List all bot signatures
prx-waf bot list

# Add a new bot pattern
prx-waf bot add "(?i)my-bad-bot" --action block

# Add a bot pattern in log-only mode
prx-waf bot add "(?i)suspicious-crawler" --action log

# Test a user-agent string
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Remove a bot pattern
prx-waf bot remove "(?i)my-bad-bot"
```

## Usage Patterns

### First-Time Setup

```bash
# 1. Run migrations
prx-waf -c configs/default.toml migrate

# 2. Create admin user
prx-waf -c configs/default.toml seed-admin

# 3. Start the server
prx-waf -c configs/default.toml run
```

### Rule Maintenance Workflow

```bash
# 1. Check for upstream rule updates
prx-waf rules update

# 2. Validate after update
prx-waf rules validate rules/

# 3. Review changes
prx-waf rules stats

# 4. Hot-reload
prx-waf rules reload
```

### CrowdSec Integration Setup

```bash
# 1. Run the setup wizard
prx-waf crowdsec setup

# 2. Test connectivity
prx-waf crowdsec test

# 3. Verify decisions are flowing
prx-waf crowdsec decisions
```

## Next Steps

- [Quick Start](../getting-started/quickstart) -- Get started with PRX-WAF
- [Rule Engine](../rules/) -- Understand the detection pipeline
- [Configuration Reference](../configuration/reference) -- All configuration keys
