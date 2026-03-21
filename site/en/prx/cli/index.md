---
title: CLI Reference
description: Complete reference for the prx command-line interface.
---

# CLI Reference

The `prx` binary is the single entry point for all PRX operations -- interactive chat, daemon management, channel administration, and system diagnostics.

## Global Flags

These flags are accepted by every subcommand.

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Path to the configuration file |
| `--log-level` | `-l` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | Disable colored output |
| `--quiet` | `-q` | `false` | Suppress non-essential output |
| `--help` | `-h` | | Print help information |
| `--version` | `-V` | | Print version |

## Commands

| Command | Description |
|---------|-------------|
| [`prx agent`](./agent) | Single-turn LLM interaction (pipe-friendly) |
| [`prx chat`](./chat) | Rich terminal chat with streaming and history |
| [`prx daemon`](./daemon) | Start the full PRX runtime (gateway + channels + cron + evolution) |
| [`prx gateway`](./gateway) | Standalone HTTP/WebSocket gateway server |
| [`prx onboard`](./onboard) | Interactive setup wizard |
| [`prx channel`](./channel) | Channel management (list, add, remove, start, doctor) |
| [`prx cron`](./cron) | Cron task management (list, add, remove, pause, resume) |
| [`prx evolution`](./evolution) | Self-evolution operations (status, history, config, trigger) |
| [`prx auth`](./auth) | OAuth profile management (login, refresh, logout) |
| [`prx config`](./config) | Configuration operations (schema, split, merge, get, set) |
| [`prx doctor`](./doctor) | System diagnostics (daemon health, channel status, model availability) |
| [`prx service`](./service) | Systemd/OpenRC service management (install, start, stop, status) |
| [`prx skills`](./skills) | Skill management (list, install, remove) |
| `prx status` | System status dashboard |
| `prx models refresh` | Refresh provider model catalogs |
| `prx providers` | List all supported LLM providers |
| `prx completions` | Generate shell completions (bash, zsh, fish) |

## Quick Examples

```bash
# First-time setup
prx onboard

# Start interactive chat
prx chat

# Single-turn query (scriptable)
echo "Summarize this file" | prx agent -f report.pdf

# Start the daemon with all services
prx daemon

# Check system health
prx doctor
```

## Shell Completions

Generate completions for your shell and add them to your profile:

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## Environment Variables

PRX respects the following environment variables (these override config file values):

| Variable | Description |
|----------|-------------|
| `PRX_CONFIG` | Path to config file (same as `--config`) |
| `PRX_LOG` | Log level (same as `--log-level`) |
| `PRX_DATA_DIR` | Data directory (default: `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | Anthropic provider API key |
| `OPENAI_API_KEY` | OpenAI provider API key |
| `GOOGLE_API_KEY` | Google Gemini provider API key |

## Related

- [Configuration Overview](/en/prx/config/) -- config file format and options
- [Getting Started](/en/prx/getting-started/installation) -- installation instructions
- [Troubleshooting](/en/prx/troubleshooting/) -- common errors and solutions
