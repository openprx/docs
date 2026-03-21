---
title: Plugin Development Kit (PDK)
description: API-Referenz fur das PRX Plugin Development Kit zur Erstellung von WASM-Plugins.
---

# Plugin Development Kit (PDK)

Das PRX-PDK ist ein Rust-Crate, das die Typen, Traits und Makros bereitstellt, die zum Erstellen von PRX-Plugins benotigt werden. Es handhabt Serialisierung, Host-Funktions-Bindings und den Plugin-Lebenszyklus.

## Installation

Zu Ihrer `Cargo.toml` hinzufugen:

```toml
[dependencies]
prx-pdk = "0.1"
```

## Kern-Traits

### Tool

Der `Tool`-Trait wird verwendet, um neue Werkzeuge zu registrieren, die der Agent aufrufen kann:

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

Der `Channel`-Trait fugt neue Messaging-Kanale hinzu:

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

Der `Filter`-Trait verarbeitet Nachrichten vor oder nach dem LLM:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // Return FilterAction::Pass or FilterAction::Block
}
```

## Typen

Das PDK exportiert gangige Typen: `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage` und `PluginConfig`.

## Verwandte Seiten

- [Entwicklerhandbuch](./developer-guide)
- [Host-Funktionen](./host-functions)
- [Beispiele](./examples)
