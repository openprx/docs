---
title: Руководство разработчика плагинов
description: Пошаговое руководство по разработке плагинов PRX с использованием Plugin Development Kit.
---

# Руководство разработчика плагинов

Это руководство проведёт вас через создание плагина PRX с нуля. По завершении у вас будет рабочий плагин инструмента, который можно загрузить в PRX.

## Предварительные требования

- Инструментарий Rust с целевой платформой `wasm32-wasi`
- Установленный PRX CLI
- Базовое знакомство с концепциями WASM

## Настройка проекта

```bash
# Установка целевой платформы WASM
rustup target add wasm32-wasi

# Создание нового проекта плагина
cargo new --lib my-plugin
cd my-plugin
```

Добавьте PRX PDK в ваш `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## Написание плагина инструмента

Минимальный плагин инструмента реализует трейт `Tool`:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## Сборка

```bash
cargo build --target wasm32-wasi --release
```

Скомпилированный плагин будет находиться в `target/wasm32-wasi/release/my_plugin.wasm`.

## Локальное тестирование

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## Публикация

Плагины можно распространять как `.wasm`-файлы или публиковать в реестре плагинов (скоро).

## Связанные страницы

- [Обзор системы плагинов](./)
- [Справочник PDK](./pdk)
- [Хост-функции](./host-functions)
- [Примеры](./examples)
