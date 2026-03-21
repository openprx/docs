---
title: prx onboard
description: Interactive setup wizard for first-time PRX configuration.
---

# prx onboard

Run the setup wizard to configure PRX for first use. The wizard walks through provider selection, API key setup, channel configuration, and basic preferences.

## Usage

```bash
prx onboard [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--quick` | `-q` | `false` | Quick mode -- minimal prompts, sensible defaults |
| `--provider` | `-P` | | Pre-select a provider (skip provider selection step) |
| `--config` | `-c` | `~/.config/prx/config.toml` | Config file output path |
| `--force` | `-f` | `false` | Overwrite existing config file |
| `--non-interactive` | | `false` | Non-interactive mode (requires `--provider` and env vars for keys) |

## Wizard Steps

The interactive wizard guides you through the following steps:

1. **Provider selection** -- choose your primary LLM provider (Anthropic, OpenAI, Ollama, etc.)
2. **API key configuration** -- enter and validate your API key
3. **Model selection** -- pick a default model from the chosen provider
4. **Channel setup** (optional) -- configure one or more messaging channels
5. **Memory backend** -- choose where to store conversation memory (markdown, SQLite, PostgreSQL)
6. **Security** -- set up pairing code and sandbox preferences
7. **Config review** -- preview the generated config and confirm

## Examples

```bash
# Full interactive wizard
prx onboard

# Quick setup with Anthropic
prx onboard --quick --provider anthropic

# Non-interactive (API key from environment)
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# Write config to a custom path
prx onboard --config /etc/prx/config.toml

# Re-run wizard (overwrite existing config)
prx onboard --force
```

## Quick Mode

Quick mode (`--quick`) skips optional steps and uses sensible defaults:

- Memory backend: SQLite
- Security: sandbox enabled, no pairing required
- Channels: none (add later with `prx channel add`)
- Evolution: disabled (enable later in config)

This is the fastest way to get a working config:

```bash
prx onboard --quick --provider ollama
```

## Post-Setup

After onboarding completes, you can:

```bash
# Verify the config
prx doctor

# Start chatting
prx chat

# Add more channels
prx channel add

# Start the full daemon
prx daemon
```

## Related

- [Getting Started](/en/prx/getting-started/quickstart) -- quick start guide
- [Configuration Overview](/en/prx/config/) -- config file format and options
- [prx config](./config) -- modify config after initial setup
- [prx channel](./channel) -- add channels after onboarding
