---
title: Configuration
description: Overview of PRX configuration system -- TOML-based config with hot-reload, split files, CLI tools, and schema export.
---

# Configuration

PRX uses a TOML-based configuration system with hot-reload support. All settings live in a single file (with optional split fragments), and most changes take effect immediately without restarting the daemon.

## Config File Location

The primary configuration file is:

```
~/.openprx/config.toml
```

PRX resolves the configuration directory in the following order:

1. `OPENPRX_CONFIG_DIR` environment variable (if set)
2. `OPENPRX_WORKSPACE` environment variable (if set)
3. Active workspace marker (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (default)

The workspace directory (where memory, sessions, and data are stored) defaults to `~/.openprx/workspace/`.

## TOML Format

PRX configuration uses [TOML](https://toml.io/) -- a minimal, human-readable format. Here is a minimal working configuration:

```toml
# Provider and model selection
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (or use ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."

# Memory backend
[memory]
backend = "sqlite"
auto_save = true

# Gateway server
[gateway]
port = 16830
host = "127.0.0.1"
```

## Configuration Sections

The configuration is organized into these top-level sections:

| Section | Purpose |
|---------|---------|
| *(top-level)* | Default provider, model, temperature, API key |
| `[gateway]` | HTTP gateway: host, port, pairing, rate limits |
| `[channels_config]` | Messaging channels: Telegram, Discord, Slack, etc. |
| `[channels_config.telegram]` | Telegram bot configuration |
| `[channels_config.discord]` | Discord bot configuration |
| `[memory]` | Memory backend and embedding settings |
| `[router]` | Heuristic LLM router and Automix |
| `[security]` | Sandbox, resource limits, audit logging |
| `[autonomy]` | Autonomy levels and tool scope rules |
| `[observability]` | Metrics and tracing backend |
| `[mcp]` | Model Context Protocol server integration |
| `[browser]` | Browser automation tool settings |
| `[web_search]` | Web search and fetch tool settings |
| `[xin]` | Xin autonomous task engine |
| `[reliability]` | Retry and fallback provider chains |
| `[cost]` | Spending limits and model pricing |
| `[cron]` | Scheduled job definitions |
| `[self_system]` | Self-evolution engine controls |
| `[proxy]` | HTTP/HTTPS/SOCKS5 proxy settings |
| `[secrets]` | Encrypted credential store |
| `[auth]` | External credential import (Codex CLI, etc.) |
| `[storage]` | Persistent storage provider |
| `[tunnel]` | Public tunnel exposure |
| `[nodes]` | Remote node proxy configuration |

See [Configuration Reference](/en/prx/config/reference) for the full field-by-field documentation.

## Split Configuration Files

For complex deployments, PRX supports splitting configuration into fragment files under a `config.d/` directory next to `config.toml`:

```
~/.openprx/
  config.toml          # Main config (top-level + overrides)
  config.d/
    channels.toml      # [channels_config] section
    memory.toml        # [memory] and [storage] sections
    security.toml      # [security] and [autonomy] sections
    agents.toml        # [agents] and [sessions_spawn] sections
    identity.toml      # [identity] and [identity_bindings] sections
    network.toml       # [gateway], [tunnel], and [proxy] sections
    scheduler.toml     # [scheduler], [cron], and [heartbeat] sections
```

Fragment files are merged on top of `config.toml` (fragments take precedence). Files are loaded alphabetically.

## How to Edit

### Interactive Wizard

The onboarding wizard walks through provider selection, channel setup, and memory configuration:

```bash
prx onboard
```

### CLI Config Commands

View and modify configuration from the command line:

```bash
# Show current configuration
prx config show

# Edit a specific value
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# Trigger a manual reload
prx config reload
```

### Direct Editing

Open `~/.openprx/config.toml` in any text editor. Changes are detected automatically by the file watcher and applied within 1 second (see [Hot Reload](/en/prx/config/hot-reload)).

### Schema Export

Export the full configuration schema as JSON Schema for editor autocompletion and validation:

```bash
prx config schema
```

This outputs a JSON Schema document that can be used with VS Code, IntelliJ, or any editor that supports TOML schema validation.

## Hot Reload

Most configuration changes are applied immediately without restarting PRX. The file watcher uses a 1-second debounce window and atomically swaps the live configuration on successful parse. If the new file has syntax errors, the previous configuration is retained and a warning is logged.

See [Hot Reload](/en/prx/config/hot-reload) for details on what requires a restart.

## Next Steps

- [Configuration Reference](/en/prx/config/reference) -- full field-by-field documentation
- [Hot Reload](/en/prx/config/hot-reload) -- what changes live vs. requires restart
- [Environment Variables](/en/prx/config/environment) -- env vars, API keys, and `.env` support
- [LLM Providers](/en/prx/providers/) -- provider-specific configuration
