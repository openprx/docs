---
title: WASM-плагины
description: WASM-плагинная система PRX-Email для изолированного выполнения в PRX-среде. WIT host-calls, переключатель безопасности сети и руководство по разработке плагинов.
---

# WASM-плагины

PRX-Email включает WASM-плагин, компилирующий почтовый клиент в WebAssembly для изолированного выполнения внутри PRX-среды. Плагин использует WIT (WebAssembly Interface Types) для определения host-call интерфейсов, позволяя WASM-коду вызывать операции с электронной почтой: sync, list, get, search, send и reply.

## Архитектура

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### Модель выполнения

Когда WASM-плагин вызывает `email.execute`, плагин направляет вызов к соответствующей host-call функции. Хост-среда выполнения обрабатывает фактические IMAP/SMTP-операции, и результаты возвращаются обратно через WIT-интерфейс.

## Переключатель безопасности сети

Реальное выполнение IMAP/SMTP из WASM-контекста **отключено по умолчанию**. Это предотвращает непреднамеренные сетевые подключения из изолированных плагинов.

### Включение сетевых операций

Установите переменную окружения перед запуском PRX-среды:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Поведение при отключённой сети

| Операция | Поведение |
|----------|-----------|
| `email.sync` | Возвращает ошибку `EMAIL_NETWORK_GUARD` |
| `email.send` | Возвращает ошибку `EMAIL_NETWORK_GUARD` |
| `email.reply` | Возвращает ошибку `EMAIL_NETWORK_GUARD` |
| `email.list` | Работает (читает из локального SQLite) |
| `email.get` | Работает (читает из локального SQLite) |
| `email.search` | Работает (читает из локального SQLite) |

::: tip
Операции только для чтения (list, get, search) всегда работают, потому что они запрашивают локальную SQLite-базу данных без сетевого доступа. Только операции, требующие IMAP/SMTP-подключений, ограничены.
:::

### Хост-возможность недоступна

Когда хост-среда выполнения не предоставляет email-возможность вообще (путь выполнения не-WASM), операции возвращают `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

## Структура плагина

```
wasm-plugin/
  Cargo.toml          # Конфигурация крейта плагина
  plugin.toml         # Манифест плагина
  plugin.wasm         # Предварительно скомпилированный WASM-бинарник
  src/
    lib.rs            # Точка входа плагина и диспетчер
    bindings.rs       # WIT-генерированные привязки
  wit/                # Определения WIT-интерфейсов
    deps/
      prx-host/       # Интерфейсы, предоставляемые хостом
```

### Конфигурация Cargo

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## Сборка плагина

### Предварительные требования

- Rust toolchain
- Цель `wasm32-wasip1`

### Шаги сборки

```bash
# Добавить WASM-цель
rustup target add wasm32-wasip1

# Собрать плагин
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Использование скрипта сборки

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT-интерфейс

Плагин взаимодействует с хостом через WIT-определённые интерфейсы. Пакет `prx:host` предоставляет следующие host-call функции:

### Доступные host-calls

| Функция | Описание | Требуется сеть |
|---------|----------|:--------------:|
| `email.sync` | Синхронизация IMAP-входящих для аккаунта/папки | Да |
| `email.list` | Список сообщений из локальной базы данных | Нет |
| `email.get` | Получение конкретного сообщения по ID | Нет |
| `email.search` | Поиск сообщений по запросу | Нет |
| `email.send` | Отправка нового письма через SMTP | Да |
| `email.reply` | Ответ на существующее письмо | Да |

### Формат запроса/ответа

Host-calls используют JSON-сериализацию для payload запросов и ответов:

```rust
// Пример: список сообщений
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## Рабочий процесс разработки

### 1. Изменение кода плагина

Редактируйте `wasm-plugin/src/lib.rs` для добавления пользовательской логики:

```rust
// Добавить предобработку перед операциями с электронной почтой
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Пользовательская валидация, логирование или преобразование
    Ok(())
}
```

### 2. Пересборка

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. Локальное тестирование

Тестирование с отключённым переключателем безопасности сети:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Запустить PRX-среду с обновлённым плагином
```

### 4. Развёртывание

Скопируйте скомпилированный `.wasm`-файл в директорию плагинов вашей PRX-среды.

## Модель безопасности

| Ограничение | Применение |
|-------------|------------|
| Сетевой доступ | Отключён по умолчанию; требует `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| Доступ к файловой системе | Нет прямого доступа к ФС из WASM |
| Память | Ограничена лимитами линейной памяти WASM |
| Время выполнения | Ограничено измерением топлива |
| Безопасность токенов | OAuth-токены управляются хостом, не передаются в WASM |

::: warning
WASM-плагин не имеет прямого доступа к OAuth-токенам или учётным данным. Вся аутентификация обрабатывается хост-средой. Плагин получает только результаты операций, но никогда не получает сырые учётные данные.
:::

## Следующие шаги

- [Установка](../getting-started/installation) — инструкции по сборке WASM-плагина
- [Справочник конфигурации](../configuration/) — переключатель безопасности сети и настройки среды выполнения
- [Устранение неполадок](../troubleshooting/) — проблемы, связанные с плагинами
