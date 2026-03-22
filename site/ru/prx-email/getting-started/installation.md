---
title: Установка
description: Установка PRX-Email из исходного кода, добавление как Cargo-зависимости или сборка WASM-плагина для интеграции в PRX-среду.
---

# Установка

PRX-Email можно использовать как Rust-библиотечную зависимость, собрать из исходного кода для автономного использования или скомпилировать как WASM-плагин для PRX-среды.

::: tip Рекомендуется
Для большинства пользователей добавление PRX-Email как **Cargo-зависимости** — это самый быстрый способ интеграции возможностей электронной почты в Rust-проект.
:::

## Предварительные требования

| Требование | Минимум | Примечания |
|-----------|---------|------------|
| Rust | 1.85.0 (редакция 2024) | Требуется для всех методов установки |
| Git | 2.30+ | Для клонирования репозитория |
| SQLite | bundled | Включено через bundled-функцию `rusqlite`; системный SQLite не нужен |
| Цель `wasm32-wasip1` | latest | Нужна только для компиляции WASM-плагина |

## Метод 1: Cargo-зависимость (рекомендуется)

Добавьте PRX-Email в `Cargo.toml` вашего проекта:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

Это подтянет библиотеку и все зависимости, включая `rusqlite` (bundled SQLite), `imap`, `lettre` и `mail-parser`.

::: warning Зависимости сборки
Bundled-функция `rusqlite` компилирует SQLite из C-исходников. На Debian/Ubuntu вам могут понадобиться:
```bash
sudo apt install -y build-essential pkg-config
```
На macOS требуются Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

## Метод 2: Сборка из исходного кода

Клонируйте репозиторий и соберите в режиме release:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

Запустите набор тестов для проверки работоспособности:

```bash
cargo test
```

Запустите clippy для проверки линтером:

```bash
cargo clippy -- -D warnings
```

## Метод 3: WASM-плагин

WASM-плагин позволяет PRX-Email работать внутри PRX-среды как изолированный WebAssembly-модуль. Плагин использует WIT (WebAssembly Interface Types) для определения host-call интерфейсов.

### Сборка WASM-плагина

```bash
cd prx_email

# Добавить WASM-цель
rustup target add wasm32-wasip1

# Собрать плагин
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

Скомпилированный плагин находится по адресу `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

Альтернативно используйте скрипт сборки:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Конфигурация плагина

WASM-плагин включает манифест `plugin.toml` в директории `wasm-plugin/`, определяющий метаданные и возможности плагина.

### Переключатель безопасности сети

По умолчанию WASM-плагин работает с **отключёнными реальными сетевыми операциями**. Для включения реальных IMAP/SMTP-подключений из WASM-контекста:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

При отключённой сети, зависящие от неё операции (`email.sync`, `email.send`, `email.reply`) возвращают управляемую ошибку с подсказкой от защиты. Это мера безопасности для предотвращения непреднамеренного сетевого доступа из изолированных плагинов.

## Зависимости

PRX-Email использует следующие ключевые зависимости:

| Крейт | Версия | Назначение |
|-------|--------|------------|
| `rusqlite` | 0.31 | SQLite-база данных с bundled C-компиляцией |
| `imap` | 2.4 | IMAP-клиент для синхронизации входящих |
| `lettre` | 0.11 | SMTP-клиент для отправки писем |
| `mail-parser` | 0.10 | Разбор MIME-сообщений |
| `rustls` | 0.23 | TLS для IMAP-подключений |
| `rustls-connector` | 0.20 | Обёртка TLS-потока |
| `serde` / `serde_json` | 1.0 | Сериализация моделей и API-ответов |
| `sha2` | 0.10 | SHA-256 для резервных идентификаторов сообщений |
| `base64` | 0.22 | Кодирование Base64 для вложений |
| `thiserror` | 1.0 | Вывод типов ошибок |

Все TLS-подключения используют `rustls` (чистый Rust) — без зависимости от OpenSSL.

## Проверка установки

После сборки убедитесь, что библиотека компилируется и тесты проходят:

```bash
cargo check
cargo test
```

Ожидаемый вывод:

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## Следующие шаги

- [Быстрый старт](./quickstart) — настройка первого почтового аккаунта и отправка сообщения
- [Управление аккаунтами](../accounts/) — настройка IMAP, SMTP и OAuth
- [WASM-плагины](../plugins/) — изучение WASM-плагинного интерфейса
