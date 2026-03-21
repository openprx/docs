---
title: Kit de Desarrollo de Plugins (PDK)
description: Referencia de API del Kit de Desarrollo de Plugins de PRX usado para construir plugins WASM.
---

# Kit de Desarrollo de Plugins (PDK)

El PDK de PRX es un crate de Rust que proporciona los tipos, traits y macros necesarios para construir plugins de PRX. Maneja la serializacion, vinculaciones de funciones del host y el ciclo de vida del plugin.

## Instalacion

Agregar a tu `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"
```

## Traits principales

### Tool

El trait `Tool` se usa para registrar nuevas herramientas que el agente puede llamar:

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

El trait `Channel` agrega nuevos canales de mensajeria:

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

El trait `Filter` procesa mensajes antes o despues del LLM:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // Return FilterAction::Pass or FilterAction::Block
}
```

## Tipos

El PDK exporta tipos comunes: `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage` y `PluginConfig`.

## Paginas relacionadas

- [Guia del desarrollador](./developer-guide)
- [Funciones del host](./host-functions)
- [Ejemplos](./examples)
