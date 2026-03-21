---
title: prx config
description: Inspect and modify PRX configuration from the command line.
---

# prx config

Read, write, validate, and transform the PRX configuration file without editing TOML by hand.

## Usage

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx config get`

Read a configuration value by its dotted key path.

```bash
prx config get <KEY> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Config file path |
| `--json` | `-j` | `false` | Output value as JSON |

```bash
# Get the default provider
prx config get providers.default

# Get the gateway port
prx config get gateway.port

# Get an entire section as JSON
prx config get providers --json
```

### `prx config set`

Set a configuration value.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Config file path |

```bash
# Change the default provider
prx config set providers.default "anthropic"

# Change the gateway port
prx config set gateway.port 8080

# Set a boolean
prx config set evolution.l1.enabled true

# Set a nested value
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

Print the full configuration JSON schema. Useful for editor autocompletion and validation.

```bash
prx config schema [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | stdout | Write schema to a file |
| `--format` | | `json` | Output format: `json` or `yaml` |

```bash
# Print schema to stdout
prx config schema

# Save schema for editor integration
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

Split a monolithic config file into per-section files. This creates a config directory with separate files for providers, channels, cron, etc.

```bash
prx config split [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Source config file |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | Output directory |

```bash
prx config split

# Result:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

Merge a split config directory back into a single file.

```bash
prx config merge [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | Source directory |
| `--output` | `-o` | `~/.config/prx/config.toml` | Output file |
| `--force` | `-f` | `false` | Overwrite existing output file |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## Examples

```bash
# Quick config inspection
prx config get .  # print entire config

# Update provider key
prx config set providers.anthropic.api_key "sk-ant-..."

# Generate schema for VS Code
prx config schema --output ~/.config/prx/schema.json
# Then in VS Code settings.json:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# Backup and split for version control
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## Related

- [Configuration Overview](/en/prx/config/) -- config file format and structure
- [Full Reference](/en/prx/config/reference) -- all configuration options
- [Hot Reload](/en/prx/config/hot-reload) -- runtime config reloading
- [Environment Variables](/en/prx/config/environment) -- env var overrides
