---
title: Примеры плагинов
description: Примеры плагинов PRX, демонстрирующие распространённые паттерны и сценарии использования.
---

# Примеры плагинов

На этой странице представлены примеры плагинов для быстрого начала разработки плагинов PRX.

## Пример 1: Простой плагин инструмента

Плагин инструмента, преобразующий текст в верхний регистр:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "uppercase",
    description = "Convert text to uppercase"
)]
fn uppercase(text: String) -> Result<String, PluginError> {
    Ok(text.to_uppercase())
}
```

## Пример 2: Инструмент HTTP API

Плагин инструмента, получающий данные из внешнего API:

```rust
use prx_pdk::prelude::*;

#[prx_tool(
    name = "github_stars",
    description = "Get star count for a GitHub repository"
)]
fn github_stars(repo: String) -> Result<String, PluginError> {
    let url = format!("https://api.github.com/repos/{}", repo);
    let resp = http_get(&url)?;
    // Парсинг и возврат количества звёзд
    Ok(resp.body)
}
```

## Пример 3: Фильтр контента

Плагин фильтра, маскирующий конфиденциальную информацию:

```rust
use prx_pdk::prelude::*;

#[prx_filter(stage = "post")]
fn redact_emails(message: &str) -> Result<FilterAction, PluginError> {
    let redacted = message.replace(
        |c: char| c == '@',
        "[REDACTED]"
    );
    Ok(FilterAction::Replace(redacted))
}
```

## Пример 4: Плагин с конфигурацией

Плагин, читающий из своей конфигурации:

```rust
use prx_pdk::prelude::*;

#[prx_tool(name = "greet")]
fn greet(name: String) -> Result<String, PluginError> {
    let greeting = config_get("greeting").unwrap_or("Hello".to_string());
    Ok(format!("{}, {}!", greeting, name))
}
```

Конфигурация в `config.toml`:

```toml
[[plugins.registry]]
name = "greet"
path = "greet.wasm"
enabled = true

[plugins.registry.config]
greeting = "Welcome"
```

## Связанные страницы

- [Руководство разработчика](./developer-guide)
- [Справочник PDK](./pdk)
- [Хост-функции](./host-functions)
