---
title: Plugin Development Kit (PDK)
description: API reference for the PRX Plugin Development Kit used to build WASM plugins.
---

# Plugin Development Kit (PDK)

The PRX PDK is a Rust crate that provides the types, traits, and macros needed to build PRX plugins. It handles serialization, host function bindings, and the plugin lifecycle.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"
```

## Core Traits

### Tool

The `Tool` trait is used to register new tools that the agent can call:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "weather",
    description = "Get current weather for a location"
)]
fn weather(location: String) -> Result<String, PluginError> {
    let resp = http_get(&format!("https://api.weather.com/{}", location))?;
    Ok(resp.body)
}
```

### Channel

The `Channel` trait adds new messaging channels:

```rust
use prx_pdk::prelude::*;

#[prx_channel(name = "my-chat")]
struct MyChatChannel;

impl Channel for MyChatChannel {
    fn send(&self, message: &str) -> Result<(), PluginError> { /* ... */ }
    fn receive(&self) -> Result<Option<String>, PluginError> { /* ... */ }
}
```

### Filter

The `Filter` trait processes messages before or after the LLM:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // Return FilterAction::Pass or FilterAction::Block
}
```

## Types

The PDK exports common types: `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage`, and `PluginConfig`.

## Related Pages

- [Developer Guide](./developer-guide)
- [Host Functions](./host-functions)
- [Examples](./examples)
