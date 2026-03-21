---
title: Plugin System
description: Overview of the PRX WASM-based plugin system for extending agent capabilities.
---

# Plugin System

PRX supports a WebAssembly (WASM) plugin system that allows extending agent capabilities without modifying the core codebase. Plugins run in a sandboxed WASM runtime with controlled access to host functions.

## Overview

The plugin system provides:

- **Sandboxed execution** -- plugins run in WASM with memory isolation
- **Host function API** -- controlled access to HTTP, filesystem, and agent state
- **Hot reloading** -- load and unload plugins without restarting the daemon
- **Multi-language support** -- write plugins in Rust, Go, C, or any language that compiles to WASM

## Plugin Types

| Type | Description | Example |
|------|-------------|---------|
| **Tool plugins** | Add new tools to the agent | Custom API integrations |
| **Channel plugins** | Add new messaging channels | Custom chat platform |
| **Filter plugins** | Pre/post-process messages | Content moderation |
| **Provider plugins** | Add new LLM providers | Custom model endpoints |

## Quick Start

```bash
# Install a plugin from a URL
prx plugin install https://example.com/my-plugin.wasm

# List installed plugins
prx plugin list

# Enable/disable a plugin
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## Configuration

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## Related Pages

- [Architecture](./architecture)
- [Developer Guide](./developer-guide)
- [Host Functions](./host-functions)
- [PDK (Plugin Development Kit)](./pdk)
- [Examples](./examples)
