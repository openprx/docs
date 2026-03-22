---
title: Установка
description: "Установка PRX-Memory из исходного кода с помощью Cargo или сборка бинарного файла демона для stdio и HTTP транспортов."
---

# Установка

PRX-Memory распространяется как Rust-воркспейс. Основной артефакт — бинарный файл демона `prx-memoryd` из крейта `prx-memory-mcp`.

::: tip Рекомендуется
Сборка из исходного кода даёт доступ к последним функциям и позволяет включить опциональные бэкенды, такие как LanceDB.
:::

## Предварительные требования

| Требование | Минимум | Примечания |
|-----------|---------|------------|
| Rust | стабильный toolchain | Установить через [rustup](https://rustup.rs/) |
| Операционная система | Linux, macOS, Windows (WSL2) | Любая платформа, поддерживаемая Rust |
| Git | 2.30+ | Для клонирования репозитория |
| Дисковое пространство | 100 МБ | Бинарный файл + зависимости |
| ОЗУ | 256 МБ | Больше рекомендуется для крупных баз памяти |

## Метод 1: Сборка из исходного кода (рекомендуется)

Клонируйте репозиторий и соберите в режиме release:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

Бинарный файл находится по адресу `target/release/prx-memoryd`. Скопируйте его в PATH:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### Опции сборки

| Флаг функции | По умолчанию | Описание |
|-------------|------------|----------|
| `lancedb-backend` | отключён | Бэкенд векторного хранения LanceDB |

Для сборки с поддержкой LanceDB:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Зависимости сборки
На Debian/Ubuntu вам могут понадобиться:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
На macOS требуются Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

## Метод 2: Cargo Install

Если у вас установлен Rust, вы можете установить напрямую:

```bash
cargo install prx-memory-mcp
```

Это компилирует из исходного кода и помещает бинарный файл `prx-memoryd` в `~/.cargo/bin/`.

## Метод 3: Использование как библиотеки

Для использования крейтов PRX-Memory как зависимостей в вашем собственном Rust-проекте добавьте их в `Cargo.toml`:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## Проверка установки

После сборки убедитесь, что бинарный файл запускается:

```bash
prx-memoryd --help
```

Тестирование базовой stdio-сессии:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Тестирование HTTP-сессии:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Проверьте эндпоинт работоспособности:

```bash
curl -sS http://127.0.0.1:8787/health
```

## Настройка для разработки

Для разработки и тестирования используйте стандартный рабочий процесс Rust:

```bash
# Форматирование
cargo fmt --all

# Линтинг
cargo clippy --all-targets --all-features -- -D warnings

# Тестирование
cargo test --all-targets --all-features

# Проверка (быстрая обратная связь)
cargo check --all-targets --all-features
```

## Удаление

```bash
# Удалить бинарный файл
sudo rm /usr/local/bin/prx-memoryd
# Или если установлен через Cargo
cargo uninstall prx-memory-mcp

# Удалить файлы данных
rm -rf ./data/memory-db.json
```

## Следующие шаги

- [Быстрый старт](./quickstart) — запустите PRX-Memory за 5 минут
- [Конфигурация](../configuration/) — все переменные окружения и профили
- [Интеграция MCP](../mcp/) — подключение к MCP-клиенту
