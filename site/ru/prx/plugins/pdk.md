---
title: Plugin Development Kit (PDK)
description: Справочник API для PRX Plugin Development Kit, используемого для создания WASM-плагинов.
---

# Plugin Development Kit (PDK)

PRX PDK -- это крейт Rust, предоставляющий типы, трейты и макросы, необходимые для создания плагинов PRX. Он обрабатывает сериализацию, привязки хост-функций и жизненный цикл плагина.

## Установка

Добавьте в ваш `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"
```

## Основные трейты

### Tool

Трейт `Tool` используется для регистрации новых инструментов, которые может вызывать агент:

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

Трейт `Channel` добавляет новые каналы сообщений:

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

Трейт `Filter` обрабатывает сообщения до или после LLM:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "pre")]
fn content_filter(message: &str) -> Result<FilterAction, PluginError> {
    // Возвращает FilterAction::Pass или FilterAction::Block
}
```

## Типы

PDK экспортирует общие типы: `PluginError`, `FilterAction`, `ToolResult`, `ChannelMessage` и `PluginConfig`.

## Связанные страницы

- [Руководство разработчика](./developer-guide)
- [Хост-функции](./host-functions)
- [Примеры](./examples)
